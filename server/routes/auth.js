const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resetPassword, getProfile, updateProfile, getCreditStatus, getRealtimeCredits } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/credits', protect, getCreditStatus);
router.get('/credits/realtime', protect, getRealtimeCredits);

module.exports = router;
