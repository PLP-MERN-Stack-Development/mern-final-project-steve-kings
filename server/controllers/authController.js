const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { username, email, password, phoneNumber } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            username,
            email,
            password,
            phoneNumber
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email for password reset
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            res.json({
                message: 'Email verified',
                found: true,
                userId: user._id
            });
        } else {
            res.status(404).json({
                message: 'No account found with this email',
                found: false
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        user.username = req.body.username || user.username;
        user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

        // Check if email is being changed and if it's already taken
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = req.body.email;
        }

        // Update password if provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user credit status
// @route   GET /api/auth/credits
// @access  Private
exports.getCreditStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const creditSummary = user.getCreditSummary();

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            electionPackages: creditSummary.electionPackages,
            availablePackages: creditSummary.packages.available.map(c => ({
                id: c._id,
                plan: c.plan,
                voterLimit: c.voterLimit,
                price: c.price,
                transactionId: c.transactionId,
                purchaseDate: c.purchaseDate,
                used: c.used
            })),
            usedPackages: creditSummary.packages.used.map(c => ({
                id: c._id,
                plan: c.plan,
                voterLimit: c.voterLimit,
                price: c.price,
                transactionId: c.transactionId,
                purchaseDate: c.purchaseDate,
                used: c.used,
                electionId: c.electionId
            })),
            message: creditSummary.needsPackage 
                ? 'No election packages available. Please purchase a package to create an election.'
                : `You have ${creditSummary.electionPackages.available} available package(s).`,
            topUpUrl: '/pricing'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get real-time credit status
// @route   GET /api/auth/credits/realtime
// @access  Private
exports.getRealtimeCredits = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const creditSummary = user.getCreditSummary();

        res.json({
            electionPackages: {
                total: user.electionCredits.length,
                available: user.electionCredits.filter(c => !c.used).length,
                used: user.electionCredits.filter(c => c.used).length
            },
            availablePackages: creditSummary.packages.available,
            usedPackages: creditSummary.packages.used,
            message: creditSummary.needsPackage
                ? 'No election packages available. Purchase a package to create an election.' 
                : `You have ${creditSummary.electionPackages.available} available package(s).`
        });
    } catch (error) {
        console.error('Get realtime credits error:', error);
        res.status(500).json({ message: error.message });
    }
};
