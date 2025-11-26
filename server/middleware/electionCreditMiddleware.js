const User = require('../models/User');

// Middleware to check if user has available election credits
exports.requireElectionCredit = async (req, res, next) => {
    try {
        console.log('=== Election Credit Check ===');
        console.log('User ID:', req.user._id || req.user.id);

        const user = await User.findById(req.user._id || req.user.id);

        if (!user) {
            console.log('ERROR: User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('User:', user.username);
        console.log('Total Credits:', user.electionCredits?.length || 0);

        // Check if user has any unused credits
        const availableCredit = user.electionCredits.find(credit => !credit.used);

        if (!availableCredit) {
            console.log('ERROR: No available credits found');
            console.log('All credits:', JSON.stringify(user.electionCredits, null, 2));
            return res.status(403).json({
                success: false,
                message: 'No election credits available. Please purchase a plan first.',
                redirectTo: '/pricing',
                totalCredits: user.electionCredits?.length || 0,
                usedCredits: user.electionCredits?.filter(c => c.used).length || 0
            });
        }

        console.log('✅ Available credit found:', availableCredit.plan, availableCredit.voterLimit, 'voters');

        // Attach the credit to request for later use
        req.electionCredit = availableCredit;
        next();
    } catch (error) {
        console.error('Election credit check error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
