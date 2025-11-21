const express = require('express');
const router = express.Router();
const { updatePaymentStatus } = require('../controllers/paymentController');
const { initiateSTKPush, handleCallback } = require('../controllers/kopokopoController');
const { protect } = require('../middleware/authMiddleware');

// Legacy manual update (keep for now or remove if not needed)
router.post('/success', protect, updatePaymentStatus);

// Optional auth middleware - attaches user if token exists, but doesn't require it
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        // If token exists, try to verify it
        const jwt = require('jsonwebtoken');
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const User = require('../models/User');
            User.findById(decoded.id).then(user => {
                if (user) {
                    req.user = user;
                }
                next();
            });
        } catch (error) {
            // Invalid token, continue as guest
            next();
        }
    } else {
        // No token, continue as guest
        next();
    }
};

// Kopokopo Routes
router.post('/stk-push', optionalAuth, initiateSTKPush);
router.post('/callback', handleCallback);

module.exports = router;
