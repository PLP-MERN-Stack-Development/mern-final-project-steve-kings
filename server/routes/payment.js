const express = require('express');
const router = express.Router();
const { updatePaymentStatus } = require('../controllers/paymentController');
const { initiateSTKPush, handleCallback } = require('../controllers/kopokopoController');
const { protect } = require('../middleware/authMiddleware');

// Legacy manual update (keep for now or remove if not needed)
router.post('/success', protect, updatePaymentStatus);

// Kopokopo Routes - REQUIRE AUTHENTICATION FOR ALL PAYMENTS
router.post('/stk-push', protect, initiateSTKPush);
router.post('/callback', handleCallback);

// Check transaction status
router.get('/transaction/:transactionId', protect, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const transaction = await Transaction.findOne({ 
            transactionId: req.params.transactionId 
        });

        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: 'Transaction not found' 
            });
        }

        res.json({
            success: true,
            transaction: {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                status: transaction.status,
                plan: transaction.plan,
                voterLimit: transaction.voterLimit,
                processed: transaction.processed,
                createdAt: transaction.createdAt,
                updatedAt: transaction.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get user's transactions
router.get('/my-transactions', protect, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({ 
            userId: req.user._id 
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Manual credit assignment (for real payments that webhook didn't process)
router.post('/manual-credit', protect, async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        if (!transactionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Transaction ID required' 
            });
        }

        const Transaction = require('../models/Transaction');
        const User = require('../models/User');

        // Find transaction
        const transaction = await Transaction.findOne({ transactionId });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: 'Transaction not found. Please ensure you completed the M-Pesa payment.' 
            });
        }

        // Verify transaction belongs to this user
        if (transaction.userId && transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'This transaction does not belong to you' 
            });
        }

        // Check if already processed
        if (transaction.processed) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credits already added for this transaction. Check your dashboard.' 
            });
        }

        // Only allow manual completion for Pending transactions
        // This prevents fake completions - transaction must exist from real STK push
        if (transaction.status === 'Pending') {
            // Check transaction age - must be recent (within last 10 minutes)
            const transactionAge = Date.now() - new Date(transaction.createdAt).getTime();
            const tenMinutes = 10 * 60 * 1000;
            
            if (transactionAge > tenMinutes) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Transaction is too old. Please initiate a new payment.' 
                });
            }

            // Update transaction to Success (user confirmed they paid)
            transaction.status = 'Success';
            transaction.updatedAt = Date.now();
            await transaction.save();
            
            console.log(`✅ Manual completion: Transaction ${transactionId} marked as Success`);
        } else if (transaction.status !== 'Success') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot complete ${transaction.status} transaction. Status must be Pending or Success.` 
            });
        }

        // Find user
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if credit already exists
        const existingCredit = user.electionCredits.find(
            credit => credit.transactionId === transactionId
        );

        if (existingCredit) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credit already added for this transaction' 
            });
        }

        // Add election package
        user.electionCredits.push({
            plan: transaction.plan,
            voterLimit: transaction.voterLimit,
            price: transaction.amount,
            transactionId: transaction.transactionId,
            paymentDate: transaction.createdAt
        });

        await user.save();

        // Mark transaction as processed
        transaction.processed = true;
        await transaction.save();

        console.log(`✅ Manual credit added: Package for user ${user.username}`);
        console.log(`   Plan: ${transaction.plan}`);
        console.log(`   Voter Limit: ${transaction.voterLimit}`);
        console.log(`   Transaction: ${transaction.transactionId}`);

        // Emit Socket.io event for real-time dashboard update
        const io = req.app.get('io');
        if (io) {
            io.to(user._id.toString()).emit('payment_success', {
                status: 'success',
                amount: transaction.amount,
                transactionId: transaction.transactionId,
                plan: transaction.plan,
                voterLimit: transaction.voterLimit,
                timestamp: Date.now()
            });
            console.log('✅ Socket.io event emitted to dashboard');
        }

        res.json({
            success: true,
            message: 'Payment confirmed! Package added to your account.',
            credit: {
                plan: transaction.plan,
                voterLimit: transaction.voterLimit,
                transactionId: transaction.transactionId
            }
        });

    } catch (error) {
        console.error('Manual credit error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Health check endpoint for Kopokopo configuration
router.get('/kopokopo-health', async (req, res) => {
    try {
        const hasClientId = !!process.env.KOPOKOPO_CLIENT_ID && process.env.KOPOKOPO_CLIENT_ID !== 'your_client_id_here';
        const hasClientSecret = !!process.env.KOPOKOPO_CLIENT_SECRET;
        const hasCallbackUrl = !!process.env.KOPOKOPO_CALLBACK_URL;
        const hasTillNumber = !!process.env.KOPOKOPO_TILL_NUMBER;
        
        const isConfigured = hasClientId && hasClientSecret && hasCallbackUrl && hasTillNumber;
        
        res.json({
            success: true,
            configured: isConfigured,
            testMode: !isConfigured,
            details: {
                hasClientId,
                hasClientSecret,
                hasCallbackUrl,
                hasTillNumber,
                callbackUrl: hasCallbackUrl ? process.env.KOPOKOPO_CALLBACK_URL : 'Not set',
                baseUrl: process.env.KOPOKOPO_BASE_URL || 'https://api.kopokopo.com'
            },
            message: isConfigured 
                ? 'Kopokopo is properly configured' 
                : 'Running in TEST MODE - Kopokopo not configured'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Check payment status (for frontend polling as fallback)
router.get('/check-status/:transactionId', protect, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const transaction = await Transaction.findOne({ 
            transactionId: req.params.transactionId 
        });

        if (!transaction) {
            return res.json({ 
                success: false, 
                status: 'not_found',
                message: 'Transaction not found' 
            });
        }

        // Map status to frontend-friendly values
        let status = transaction.status.toLowerCase();
        let message = '';
        
        if (status === 'success') {
            message = 'Payment successful';
        } else if (status === 'failed') {
            message = 'Payment failed';
        } else if (status === 'cancelled') {
            message = 'Payment cancelled by user';
        } else if (status === 'pending') {
            message = 'Waiting for payment';
        }

        res.json({
            success: true,
            status: status,
            processed: transaction.processed,
            message: message,
            transaction: {
                transactionId: transaction.transactionId,
                amount: transaction.amount,
                status: transaction.status,
                plan: transaction.plan,
                voterLimit: transaction.voterLimit,
                processed: transaction.processed,
                createdAt: transaction.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Verify transaction with Kopokopo
router.post('/verify-transaction', protect, async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        if (!transactionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Transaction ID required' 
            });
        }

        const Transaction = require('../models/Transaction');
        const User = require('../models/User');
        const axios = require('axios');

        // Find transaction
        const transaction = await Transaction.findOne({ transactionId });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: 'Transaction not found' 
            });
        }

        // Verify transaction belongs to this user
        if (transaction.userId && transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'This transaction does not belong to you' 
            });
        }

        // If already processed, no need to verify
        if (transaction.processed) {
            return res.json({ 
                success: true, 
                message: 'Transaction already processed. Credits have been added.',
                transaction: {
                    status: transaction.status,
                    processed: transaction.processed
                }
            });
        }

        console.log(`🔍 Verifying transaction ${transactionId} with Kopokopo...`);

        // Get Kopokopo access token
        const CLIENT_ID = process.env.KOPOKOPO_CLIENT_ID;
        const CLIENT_SECRET = process.env.KOPOKOPO_CLIENT_SECRET;
        const BASE_URL = process.env.KOPOKOPO_BASE_URL;

        try {
            const tokenResponse = await axios.post(`${BASE_URL}/oauth/token`, {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'client_credentials'
            });

            const token = tokenResponse.data.access_token;

            // Query Kopokopo for transaction status
            try {
                const kopoResponse = await axios.get(
                    `${BASE_URL}/api/v1/incoming_payments/${transactionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );

                const kopoData = kopoResponse.data;
                console.log('Kopokopo response:', JSON.stringify(kopoData, null, 2));

                // Check if payment was successful
                const status = kopoData.data?.attributes?.status || kopoData.status;
                
                if (status === 'Success' || status === 'Received') {
                    // Payment was successful, add credits
                    transaction.status = 'Success';
                    await transaction.save();

                    const user = await User.findById(req.user._id);
                    
                    if (user) {
                        // Check if credit already exists
                        const existingCredit = user.electionCredits.find(
                            credit => credit.transactionId === transactionId
                        );

                        if (!existingCredit) {
                            // Add election package
                            user.electionCredits.push({
                                plan: transaction.plan,
                                voterLimit: transaction.voterLimit,
                                price: transaction.amount,
                                transactionId: transaction.transactionId,
                                paymentDate: transaction.createdAt
                            });

                            await user.save();

                            // Mark as processed
                            transaction.processed = true;
                            await transaction.save();

                            console.log(`✅ Verified and credited: Package added`);
                            console.log(`   Plan: ${transaction.plan}`);
                            console.log(`   Voter Limit: ${transaction.voterLimit}`);

                            // Emit Socket.io event
                            const io = req.app.get('io');
                            if (io) {
                                io.to(user._id.toString()).emit('payment_success', {
                                    status: 'success',
                                    amount: transaction.amount,
                                    transactionId: transaction.transactionId,
                                    plan: transaction.plan,
                                    voterLimit: transaction.voterLimit,
                                    timestamp: Date.now()
                                });
                            }

                            return res.json({
                                success: true,
                                message: `✅ Payment verified! Package added to your account.`,
                                transaction: {
                                    status: 'Success',
                                    processed: true,
                                    plan: transaction.plan,
                                    voterLimit: transaction.voterLimit
                                }
                            });
                        } else {
                            return res.json({
                                success: true,
                                message: 'Payment already credited to your account.',
                                transaction: {
                                    status: transaction.status,
                                    processed: true
                                }
                            });
                        }
                    }
                } else if (status === 'Failed' || status === 'Cancelled') {
                    transaction.status = status;
                    await transaction.save();

                    return res.json({
                        success: false,
                        message: `Payment ${status.toLowerCase()}. Please try a new payment.`,
                        transaction: {
                            status: status,
                            processed: false
                        }
                    });
                } else {
                    // Still pending
                    return res.json({
                        success: false,
                        message: 'Payment still pending. Please complete the M-Pesa payment on your phone.',
                        transaction: {
                            status: 'Pending',
                            processed: false
                        }
                    });
                }
            } catch (kopoError) {
                if (kopoError.response?.status === 404) {
                    return res.json({
                        success: false,
                        message: 'Transaction not found in Kopokopo. It may still be processing.',
                        transaction: {
                            status: transaction.status,
                            processed: false
                        }
                    });
                }
                throw kopoError;
            }
        } catch (authError) {
            console.error('Kopokopo auth error:', authError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to connect to Kopokopo. Please try again later.'
            });
        }

    } catch (error) {
        console.error('Verify transaction error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// TEST ENDPOINT: Manually complete a pending payment (for debugging)
router.post('/test-complete/:transactionId', protect, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const User = require('../models/User');

        const transaction = await Transaction.findOne({ 
            transactionId: req.params.transactionId 
        });

        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: 'Transaction not found' 
            });
        }

        // Update transaction to success
        transaction.status = 'Success';
        transaction.processed = true;
        await transaction.save();

        // Add credit to user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if credit already exists
        const existingCredit = user.electionCredits.find(
            c => c.transactionId === transaction.transactionId
        );

        if (!existingCredit) {
            user.electionCredits.push({
                plan: transaction.plan,
                voterLimit: transaction.voterLimit,
                price: transaction.amount,
                transactionId: transaction.transactionId,
                paymentDate: new Date()
            });
            await user.save();

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.to(req.user._id.toString()).emit('payment_success', {
                    status: 'success',
                    amount: transaction.amount,
                    transactionId: transaction.transactionId,
                    plan: transaction.plan,
                    voterLimit: transaction.voterLimit,
                    timestamp: Date.now()
                });
            }

            res.json({
                success: true,
                message: 'Payment completed successfully',
                credit: {
                    plan: transaction.plan,
                    voterLimit: transaction.voterLimit,
                    transactionId: transaction.transactionId
                }
            });
        } else {
            res.json({
                success: true,
                message: 'Credit already exists',
                credit: existingCredit
            });
        }
    } catch (error) {
        console.error('Test complete error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
