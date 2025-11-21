const axios = require('axios');

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

        // Simulate async payment processing
        setTimeout(async () => {
            console.log('📱 Simulating payment success...');

            // Add credit to user's account
            if (req.user) {
                const User = require('../models/User');
                const user = await User.findById(req.user._id);

                if (user) {
                    let planDetails = null;
                    const paymentAmount = parseFloat(amount);

                    if (paymentAmount === 5) {
                        planDetails = { plan: 'free', voterLimit: 10, price: 5 };
                    } else if (paymentAmount === 500) {
                        planDetails = { plan: 'starter', voterLimit: 50, price: 500 };
                    } else if (paymentAmount === 1500) {
                        planDetails = { plan: 'standard', voterLimit: 200, price: 1500 };
                    } else if (paymentAmount === 3000) {
                        planDetails = { plan: 'unlimited', voterLimit: -1, price: 3000 };
                    }

                    if (planDetails) {
                        user.electionCredits.push({
                            ...planDetails,
                            transactionId: `TEST_TXN_${Date.now()}`,
                            paymentDate: new Date()
                        });
                        await user.save();

                        console.log(`✅ TEST: Credit added to user ${user.username}`);

                        // Emit socket event
                        const io = req.app.get('io');
                        if (io) {
                            io.to(req.user._id.toString()).emit('payment_success', {
                                status: 'success',
                                amount: amount,
                                transactionId: `TEST_TXN_${Date.now()}`,
                                plan: planDetails.plan,
                                timestamp: Date.now()
                            });
                            console.log('✅ TEST: Socket event emitted');
                        }
                    }
                }
            }
        }, 3000); // Simulate 3 second delay

        return res.status(200).json({
            success: true,
            message: 'TEST MODE: Payment simulated successfully',
            testMode: true,
            data: {
                reference: `TEST_${Date.now()}`,
                status: 'Success'
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

        res.status(200).json({
            success: true,
            message: 'STK Push initiated successfully',
            data: response.data
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

        console.log('Received Kopokopo Webhook:', topic);
        console.log('Event data:', JSON.stringify(event, null, 2));

        if (topic === 'incoming_payment') {
            const { status, amount, metadata, resource } = event;

            if (resource.status === 'Success') {
                const userId = resource.metadata.user_id;
                const paymentAmount = parseFloat(resource.amount.value);

                // Determine plan based on amount
                let planDetails = null;
                if (paymentAmount === 5) {
                    planDetails = { plan: 'free', voterLimit: 10, price: 5 };
                } else if (paymentAmount === 500) {
                    planDetails = { plan: 'starter', voterLimit: 50, price: 500 };
                } else if (paymentAmount === 1500) {
                    planDetails = { plan: 'standard', voterLimit: 200, price: 1500 };
                } else if (paymentAmount === 3000) {
                    planDetails = { plan: 'unlimited', voterLimit: -1, price: 3000 };
                }

                if (userId && userId !== 'guest' && planDetails) {
                    // Update user with election credit
                    const User = require('../models/User');
                    const user = await User.findById(userId);

                    if (user) {
                        // Add credit with transaction details
                        user.electionCredits.push({
                            ...planDetails,
                            transactionId: resource.id || resource.reference || 'N/A',
                            paymentDate: new Date(resource.timestamp || Date.now())
                        });
                        await user.save();
                        console.log(`User ${user.username} received ${planDetails.plan} election credit`);
                        console.log(`Transaction ID: ${resource.id || resource.reference}`);
                        console.log(`Payment Time: ${new Date(resource.timestamp || Date.now())}`);

                        // Emit socket event to client if connected
                        const io = req.app.get('io');
                        if (io) {
                            io.to(userId.toString()).emit('payment_success', {
                                status: 'success',
                                amount: resource.amount.value,
                                transactionId: resource.id || resource.reference,
                                plan: planDetails.plan,
                                timestamp: resource.timestamp || Date.now()
                            });
                        }
                    }
                }
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ success: false });
    }
};
