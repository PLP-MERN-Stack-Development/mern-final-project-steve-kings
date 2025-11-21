const User = require('../models/User');

// @desc    Update user payment status
// @route   POST /api/payment/success
// @access  Private
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { status, amount, transactionId } = req.body;

        if (status === 'success') {
            const user = await User.findById(req.user.id);

            if (user) {
                user.subscriptionStatus = 'premium';
                await user.save();

                return res.status(200).json({
                    success: true,
                    message: 'Payment successful, subscription updated',
                    data: {
                        username: user.username,
                        email: user.email,
                        subscriptionStatus: user.subscriptionStatus
                    }
                });
            } else {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }
    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
