const Election = require('../models/Election');
const User = require('../models/User');

// @desc    Add package/credits to existing election
// @route   POST /api/elections/:id/add-package
// @access  Private
exports.addPackageToElection = async (req, res) => {
    try {
        const { electionId } = req.params;
        const { packageId } = req.body; // ID of the package from user's electionCredits

        // Find the election
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }

        // Verify user owns this election
        if (election.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to modify this election' });
        }

        // Find the user and the package
        const user = await User.findById(req.user._id);
        const packageToAdd = user.electionCredits.id(packageId);

        if (!packageToAdd) {
            return res.status(404).json({ message: 'Package not found' });
        }

        if (packageToAdd.used) {
            return res.status(400).json({ message: 'Package already used for another election' });
        }

        // Add package to election
        election.packages.push({
            packageName: packageToAdd.plan,
            credits: packageToAdd.voterLimit,
            transactionId: packageToAdd.transactionId,
            addedDate: new Date()
        });

        await election.save();

        // Mark package as used
        packageToAdd.used = true;
        packageToAdd.electionId = election._id;
        await user.save();

        console.log(`✅ Added ${packageToAdd.plan} package to election ${election.title}`);
        console.log(`   Credits: ${packageToAdd.voterLimit === -1 ? 'Unlimited' : packageToAdd.voterLimit}`);
        console.log(`   Total packages for this election: ${election.packages.length}`);

        res.json({
            success: true,
            message: 'Package added to election successfully',
            election: {
                id: election._id,
                title: election.title,
                totalPackages: election.packages.length,
                totalCredits: election.totalCredits,
                hasUnlimited: election.hasUnlimitedCredits
            }
        });
    } catch (error) {
        console.error('Add package to election error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get election packages and total credits
// @route   GET /api/elections/:id/packages
// @access  Private
exports.getElectionPackages = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        
        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }

        // Verify user owns this election
        if (election.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this election' });
        }

        res.json({
            success: true,
            packages: election.packages,
            totalCredits: election.totalCredits,
            hasUnlimited: election.hasUnlimitedCredits,
            packageCount: election.packages.length
        });
    } catch (error) {
        console.error('Get election packages error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Functions are already exported above using exports.functionName
