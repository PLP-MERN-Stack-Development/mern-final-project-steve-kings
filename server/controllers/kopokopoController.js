const axios = require('axios');
const { sendEmail, emailTemplates } = require('../config/emailService');
const PricingPlan = require('../models/PricingPlan');

// Helper function to get plan details by amount
const getPlanByAmount = async (amount) => {
    try {
        const plans = await PricingPlan.find({ enabled: true });
        const plan = plans.find(p => p.price === parseFloat(amount));
        
        if (plan) {
            return {
                plan: plan.planId,
                voterLimit: plan.voterLimit,
                price: plan.price
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting plan by amount:', error);
        return null;
    }
};

// Kopokopo Credentials from .env
const CLIENT_ID = process.env.KOPOKOPO_CLIENT_ID;
const CLIENT_SECRET = process.env.KOPOKOPO_CLIENT_SECRET;
const API_KEY = process.env.KOPOKOPO_API_KEY; // Sometimes used, but usually OAuth
const BASE_URL = process.env.KOPOKOPO_BASE_URL || 'https://api.kopokopo.com';
const CALLBACK_URL = process.env.KOPOKOPO_CALLBACK_URL; // Your server's webhook URL

// Helper to get OAuth Token
const getAccessToken = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/oauth/token`, {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Kopokopo access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to authenticate with Kopokopo');
    }
};

// @desc    Initiate STK Push via Kopokopo
// @route   POST /api/payment/stk-push
// @access  Private
exports.initiateSTKPush = async (req, res) => {
    const { phoneNumber, amount } = req.body;

    console.log('=== STK Push Request ===');
    console.log('Phone:', phoneNumber);
    console.log('Amount:', amount);
    console.log('User:', req.user ? req.user._id : 'No user (guest)');

    // Basic validation
    if (!phoneNumber || !amount) {
        console.log('Validation failed: Missing phone or amount');
        return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    // Format phone number to +254 format if needed
    let formattedPhone = phoneNumber.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('254')) {
        formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+254' + formattedPhone;
    }

    console.log('Formatted phone:', formattedPhone);

    // CHECK IF IN DEVELOPMENT/TEST MODE (when Kopokopo credentials are missing)
    const isTestMode = !CLIENT_ID || !CLIENT_SECRET || CLIENT_ID === 'your_client_id_here';

    if (isTestMode) {
        console.log('⚠️  TEST MODE: Kopokopo not configured, simulating payment');

        const testTransactionId = `TEST_TXN_${Date.now()}`;
        
        // Create pending transaction
        const Transaction = require('../models/Transaction');
        const User = require('../models/User');
        
        const paymentAmount = parseFloat(amount);
        const planDetails = await getPlanByAmount(paymentAmount);

        // Create transaction record
        const transaction = new Transaction({
            transactionId: testTransactionId,
            amount: paymentAmount,
            currency: 'KES',
            status: 'Pending',
            phoneNumber: formattedPhone,
            userId: req.user ? req.user._id : null,
            plan: planDetails ? planDetails.plan : null,
            voterLimit: planDetails ? planDetails.voterLimit : 0,
            metadata: { testMode: true }
        });
        await transaction.save();

        // Store user ID for use in setTimeout
        const userId = req.user ? req.user._id.toString() : null;
        const io = req.app.get('io');

        // Simulate async payment processing (happens in background)
        setTimeout(async () => {
            console.log('📱 TEST MODE: Simulating payment success...');

            try {
                // Reload transaction from database
                const Transaction = require('../models/Transaction');
                const User = require('../models/User');
                
                const txn = await Transaction.findOne({ transactionId: testTransactionId });
                if (!txn) {
                    console.error('❌ TEST: Transaction not found');
                    return;
                }

                // Update transaction
                txn.status = 'Success';
                txn.processed = true;
                await txn.save();
                console.log('✅ TEST: Transaction updated to Success');

                // Add credit to user's account
                if (userId && planDetails) {
                    const user = await User.findById(userId);

                    if (user) {
                        // Check if credit already exists
                        const existingCredit = user.electionCredits.find(
                            c => c.transactionId === testTransactionId
                        );

                        if (!existingCredit) {
                            user.electionCredits.push({
                                ...planDetails,
                                transactionId: testTransactionId,
                                paymentDate: new Date()
                            });
                            
                            await user.save();

                            console.log(`✅ TEST: Package added to user ${user.username}`);
                            console.log(`   Plan: ${planDetails.plan}`);
                            console.log(`   Voter Limit: ${planDetails.voterLimit}`);
                            console.log(`   Package can be used for 1 election`);

                            // Emit socket event
                            if (io) {
                                io.to(userId).emit('payment_success', {
                                    status: 'success',
                                    amount: paymentAmount,
                                    transactionId: testTransactionId,
                                    plan: planDetails.plan,
                                    voterLimit: planDetails.voterLimit,
                                    timestamp: Date.now()
                                });
                                console.log('✅ TEST: Socket event emitted to room:', userId);
                            } else {
                                console.error('❌ TEST: Socket.io not available');
                            }
                        } else {
                            console.log('⚠️  TEST: Credit already exists');
                        }
                    } else {
                        console.error('❌ TEST: User not found:', userId);
                    }
                } else {
                    console.error('❌ TEST: No user ID or plan details');
                }
            } catch (error) {
                console.error('❌ TEST: Error in payment simulation:', error);
            }
        }, 5000); // Simulate 5 second delay for payment

        // Return immediately - don't wait for payment
        return res.status(200).json({
            success: true,
            message: 'TEST MODE: STK Push sent. Complete payment on your phone.',
            testMode: true,
            data: {
                transactionId: testTransactionId,
                reference: testTransactionId,
                status: 'Pending',
                message: 'Check your phone for M-Pesa prompt'
            }
        });
    }

    try {
        console.log('Getting Kopokopo access token...');
        const token = await getAccessToken();
        console.log('Access token obtained');

        const payload = {
            payment_channel: 'M-PESA STK Push',
            till_number: process.env.KOPOKOPO_TILL_NUMBER,
            subscriber: {
                phone_number: formattedPhone,
                email: req.user ? req.user.email : 'guest@pollsync.com'
            },
            amount: {
                currency: 'KES',
                value: amount
            },
            metadata: {
                user_id: req.user ? req.user._id : 'guest',
                purpose: 'ELECTION_PAYMENT'
            },
            _links: {
                callback_url: CALLBACK_URL
            }
        };

        console.log('Sending request to Kopokopo...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(`${BASE_URL}/api/v1/incoming_payments`, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('Kopokopo Response:', response.status, response.data);

        // Extract transaction reference from response
        const transactionRef = response.data.resource_id || response.data.id || `KPK_${Date.now()}`;

        // Create pending transaction record
        const Transaction = require('../models/Transaction');
        const paymentAmount = parseFloat(amount);
        const planDetails = await getPlanByAmount(paymentAmount);

        const transaction = new Transaction({
            transactionId: transactionRef,
            amount: paymentAmount,
            currency: 'KES',
            status: 'Pending',
            phoneNumber: formattedPhone,
            userId: req.user ? req.user._id : null,
            plan: planDetails ? planDetails.plan : null,
            voterLimit: planDetails ? planDetails.voterLimit : 0,
            metadata: { 
                user_id: req.user ? req.user._id : 'guest',
                purpose: 'ELECTION_PAYMENT'
            },
            rawResponse: response.data
        });
        await transaction.save();

        console.log(`✅ Transaction created: ${transactionRef}`);

        // Return immediately - don't wait for payment
        res.status(200).json({
            success: true,
            message: 'STK Push sent successfully. Complete payment on your phone.',
            data: {
                transactionId: transactionRef,
                reference: transactionRef,
                status: 'Pending',
                message: 'Check your phone for M-Pesa prompt',
                kopokopo: response.data
            }
        });

    } catch (error) {
        console.error('=== Kopokopo STK Push Error ===');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Error:', error.message);
        }

        res.status(500).json({
            success: false,
            message: 'Failed to initiate payment',
            error: error.response ? error.response.data : error.message
        });
    }
};

// @desc    Handle Kopokopo Webhook
// @route   POST /api/payment/callback
// @access  Public
exports.handleCallback = async (req, res) => {
    try {
        const { topic, event } = req.body;

        console.log('=== Kopokopo Webhook Received ===');
        console.log('Topic:', topic);
        console.log('Event data:', JSON.stringify(event, null, 2));
        console.log('Full body:', JSON.stringify(req.body, null, 2));

        // Kopokopo sends different topics: buygoods_transaction_received, b2b_transaction_received, etc.
        if (topic === 'buygoods_transaction_received' || topic === 'incoming_payment') {
            const { resource } = event;
            const Transaction = require('../models/Transaction');
            const User = require('../models/User');

            // Handle both formats: Kopokopo API v1 and custom incoming_payment
            const mpesaReceiptNumber = resource.reference || resource.id;
            const paymentAmount = parseFloat(resource.amount?.value || resource.amount);
            const phoneNumber = resource.sender_phone_number;
            
            // Get user ID from metadata or from our transaction record
            let userId = resource.metadata ? resource.metadata.user_id : null;

            console.log('Processing payment:');
            console.log('- Transaction ID:', mpesaReceiptNumber);
            console.log('- Amount:', paymentAmount);
            console.log('- Phone:', phoneNumber);
            console.log('- User ID:', userId);
            console.log('- Status:', resource.status);

            // Determine plan based on amount (dynamic from database)
            const planDetails = await getPlanByAmount(paymentAmount);
            
            if (!planDetails) {
                console.log(`⚠️  Amount ${paymentAmount} doesn't match any active pricing plan`);
            }

            // 1. Check if transaction already exists
            let transaction = await Transaction.findOne({ transactionId: mpesaReceiptNumber });
            
            // If no transaction found by M-Pesa receipt, try to find by phone number and amount
            if (!transaction && phoneNumber && paymentAmount) {
                console.log('Transaction not found by ID, searching by phone and amount...');
                transaction = await Transaction.findOne({
                    phoneNumber: phoneNumber,
                    amount: paymentAmount,
                    status: 'Pending',
                    createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
                }).sort({ createdAt: -1 });
                
                if (transaction) {
                    console.log('Found matching pending transaction:', transaction.transactionId);
                    // Update with M-Pesa receipt number
                    transaction.transactionId = mpesaReceiptNumber;
                    userId = transaction.userId; // Get user ID from our transaction
                }
            }
            
            if (transaction) {
                console.log('Updating existing transaction...');
                transaction.status = resource.status || 'Success';
                transaction.updatedAt = Date.now();
                if (planDetails) {
                    transaction.plan = planDetails.plan;
                    transaction.voterLimit = planDetails.voterLimit;
                }
                await transaction.save();
            } else {
                // Create new transaction
                console.log('Creating new transaction record...');
                transaction = new Transaction({
                    transactionId: mpesaReceiptNumber,
                    amount: paymentAmount,
                    currency: resource.amount?.currency || 'KES',
                    status: resource.status || 'Success',
                    phoneNumber: phoneNumber,
                    userId: (userId && userId !== 'guest') ? userId : null,
                    plan: planDetails ? planDetails.plan : null,
                    voterLimit: planDetails ? planDetails.voterLimit : 0,
                    metadata: resource.metadata || {},
                    rawResponse: event
                });
                await transaction.save();
                console.log(`✅ Transaction logged: ${transaction.transactionId}`);
            }

            // 2. Process payments based on status
            // Kopokopo uses "Received" status for successful payments
            const isSuccess = resource.status === 'Success' || resource.status === 'Received';
            
            if (isSuccess && planDetails) {
                let user = null;

                // Try to find user by ID from metadata
                if (userId && userId !== 'guest') {
                    user = await User.findById(userId);
                    console.log('Found user by ID:', user ? user.username : 'Not found');
                }

                // Fallback: Try to find user by phone number
                if (!user && phoneNumber) {
                    user = await User.findOne({ phoneNumber: phoneNumber });
                    
                    if (!user) {
                        const localPhone = phoneNumber.replace('+254', '0');
                        user = await User.findOne({ phoneNumber: localPhone });
                    }
                    
                    console.log('Found user by phone:', user ? user.username : 'Not found');
                }

                if (user) {
                    // Check if credit already added (prevent duplicates)
                    const existingCredit = user.electionCredits.find(
                        credit => credit.transactionId === mpesaReceiptNumber
                    );

                    if (existingCredit) {
                        console.log('⚠️  Credit already added for this transaction');
                    } else {
                        // Add election package
                        user.electionCredits.push({
                            ...planDetails,
                            transactionId: mpesaReceiptNumber,
                            price: paymentAmount,
                            paymentDate: new Date(resource.timestamp || Date.now())
                        });

                        await user.save();
                        console.log(`✅ User ${user.username} received ${planDetails.plan} election package`);
                        console.log(`   Transaction ID: ${mpesaReceiptNumber}`);
                        console.log(`   Voter Limit: ${planDetails.voterLimit === -1 ? 'Unlimited' : planDetails.voterLimit}`);
                        console.log(`   Package can be used for 1 election`);

                        // Mark transaction as processed
                        transaction.processed = true;
                        await transaction.save();

                        // Send payment success email (non-blocking)
                        const voterLimit = planDetails.voterLimit === -1 ? 'Unlimited' : planDetails.voterLimit;
                        const paymentTemplate = emailTemplates.paymentSuccess(
                            user.username,
                            paymentAmount,
                            `${planDetails.plan} package (${voterLimit} voters)`
                        );
                        sendEmail({
                            to: user.email,
                            ...paymentTemplate
                        }).catch(err => console.error('Payment email error:', err));

                        // Emit socket event to client if connected
                        const io = req.app.get('io');
                        if (io) {
                            io.to(user._id.toString()).emit('payment_success', {
                                status: 'success',
                                amount: paymentAmount,
                                transactionId: mpesaReceiptNumber,
                                plan: planDetails.plan,
                                voterLimit: planDetails.voterLimit,
                                timestamp: resource.timestamp || Date.now()
                            });
                            console.log('✅ Socket event emitted to user');
                        }
                    }
                } else {
                    console.error('❌ Could not find user to assign credit to');
                    console.error('   Phone:', phoneNumber);
                    console.error('   User ID:', userId);
                }
            } else if (resource.status === 'Failed' || resource.status === 'Cancelled') {
                console.log(`❌ Payment ${resource.status.toLowerCase()}`);
                
                // Emit failure/cancelled event if user found
                if (userId && userId !== 'guest') {
                    const user = await User.findById(userId);
                    if (user) {
                        const io = req.app.get('io');
                        if (io) {
                            io.to(user._id.toString()).emit('payment_failed', {
                                status: resource.status.toLowerCase(),
                                amount: paymentAmount,
                                transactionId: mpesaReceiptNumber,
                                message: resource.status === 'Cancelled' ? 'Payment cancelled by user' : 'Payment failed',
                                timestamp: resource.timestamp || Date.now()
                            });
                            console.log(`✅ ${resource.status} event emitted to user`);
                        }
                    }
                } else {
                    console.log('⚠️  No user found to notify about cancellation');
                }
            }
        }

        console.log('=== Webhook Processing Complete ===\n');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('=== Webhook Error ===');
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
