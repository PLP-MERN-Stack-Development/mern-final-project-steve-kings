const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const AllowedVoter = require('../models/AllowedVoter');

// @desc    Create a new election
// @route   POST /api/elections
// @access  Private
exports.createElection = async (req, res) => {
    try {
        const { title, organization, description, startDate, endDate, thumbnailUrl } = req.body;

        // req.electionCredit is attached by requireElectionCredit middleware
        const credit = req.electionCredit;

        const election = new Election({
            title,
            organization,
            description,
            startDate,
            endDate,
            organizer: req.user._id,
            thumbnailUrl: thumbnailUrl || '',
            voterLimit: credit.voterLimit, // Store the voter limit from the plan
            planType: credit.plan, // Store which plan was used
            packages: [{
                packageName: credit.plan,
                credits: credit.voterLimit,
                transactionId: credit.transactionId || '',
                addedDate: new Date()
            }],
            // Legacy fields for backward compatibility
            packageUsed: credit.plan,
            creditsUsed: credit.voterLimit === -1 ? 999999 : credit.voterLimit,
            transactionId: credit.transactionId || ''
        });

        const createdElection = await election.save();

        // Mark the credit as used and link it to this election
        const User = require('../models/User');
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    'electionCredits.$[elem].used': true,
                    'electionCredits.$[elem].electionId': createdElection._id
                }
            },
            {
                arrayFilters: [{ 'elem._id': credit._id }]
            }
        );

        res.status(201).json(createdElection);
    } catch (error) {
        console.error('Create election error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all elections for logged in user
// @route   GET /api/elections
// @access  Private
exports.getElections = async (req, res) => {
    try {
        // We need to attach candidate count and voter count maybe?
        // For now, just basic election info is fine, but the frontend expects candidates array length.
        // Let's fetch basic info.
        const elections = await Election.find({ organizer: req.user._id }).lean();

        // Populate with counts (optional, but good for dashboard stats)
        const electionsWithStats = await Promise.all(elections.map(async (election) => {
            const candidateCount = await Candidate.countDocuments({ election: election._id });
            const voterCount = await Vote.countDocuments({ election: election._id });
            return {
                ...election,
                candidates: new Array(candidateCount), // Mock array for length check
                voters: new Array(voterCount) // Mock array for length check
            };
        }));

        res.json(electionsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get election by ID
// @route   GET /api/elections/:id
// @access  Public (or Private depending on logic)
exports.getElectionById = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id).lean();

        if (election) {
            const candidates = await Candidate.find({ election: req.params.id });
            const votes = await Vote.find({ election: req.params.id }).select('voterId');

            const electionData = {
                ...election,
                candidates,
                voters: votes.map(v => ({ studentId: v.voterId, hasVoted: true }))
            };

            res.json(electionData);
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add candidate to election
// @route   POST /api/elections/:id/candidates
// @access  Private
exports.addCandidate = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);

        if (election) {
            if (election.organizer.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            const { name, position, manifesto, photoUrl } = req.body;

            const candidate = new Candidate({
                election: election._id,
                name,
                position,
                manifesto,
                photoUrl
            });

            await candidate.save();

            // Return updated election structure
            const candidates = await Candidate.find({ election: election._id });
            const votes = await Vote.find({ election: election._id }).select('voterId');

            const electionData = election.toObject();
            electionData.candidates = candidates;
            electionData.voters = votes.map(v => ({ studentId: v.voterId, hasVoted: true }));

            res.status(201).json(electionData);
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cast a vote
// @route   POST /api/elections/:id/vote
// @access  Public
exports.vote = async (req, res) => {
    try {
        const { voterId, candidateId } = req.body;
        console.log('Vote Request:', { voterId, candidateId, electionId: req.params.id });

        const election = await Election.findById(req.params.id);

        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }

        // Check if election is active (strict time enforcement)
        const now = new Date();
        
        // Check if election hasn't started yet
        if (now < new Date(election.startDate)) {
            return res.status(403).json({ 
                message: `Voting hasn't started yet. Voting opens on ${new Date(election.startDate).toLocaleString()}`,
                status: 'upcoming',
                startDate: election.startDate
            });
        }
        
        // Check if election has ended
        if (now > new Date(election.endDate)) {
            return res.status(403).json({ 
                message: `Voting has ended. This election closed on ${new Date(election.endDate).toLocaleString()}`,
                status: 'ended',
                endDate: election.endDate
            });
        }

        // Check voter limit based on plan
        if (election.voterLimit !== -1) {
            // Count unique voters (distinct voterIds)
            const uniqueVoterCount = await Vote.distinct('voterId', { election: election._id }).then(voters => voters.length);

            if (uniqueVoterCount >= election.voterLimit) {
                return res.status(403).json({
                    message: `Voter limit reached! This election is limited to ${election.voterLimit} voters (${election.planType} plan).`,
                    upgrade: true,
                    currentPlan: election.planType,
                    voterLimit: election.voterLimit
                });
            }
        }

        // Check eligibility (if whitelist exists)
        const allowedVoterCount = await AllowedVoter.countDocuments({ election: election._id });
        if (allowedVoterCount > 0) {
            const isAllowed = await AllowedVoter.findOne({
                election: election._id,
                studentId: voterId
            });

            if (!isAllowed) {
                return res.status(403).json({ message: 'You are not on the voter list for this election' });
            }
        }

        // Find candidate first to get position
        console.log('Looking for candidate:', candidateId);
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            console.log('Candidate not found in DB');
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Check if voter has already voted for THIS POSITION
        const existingVote = await Vote.findOne({
            election: election._id,
            voterId,
            position: candidate.position
        });

        if (existingVote) {
            return res.status(400).json({ 
                message: `You have already voted for the position of ${candidate.position}` 
            });
        }

        // Record vote
        const vote = new Vote({
            election: election._id,
            candidate: candidate._id,
            position: candidate.position,
            voterId,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
        await vote.save();

        // Increment candidate vote count
        candidate.voteCount += 1;
        await candidate.save();

        // Deduct vote credit from election organizer
        const User = require('../models/User');
        const organizer = await User.findById(election.organizer);
        
        if (organizer && organizer.voteCredits > 0) {
            organizer.voteCredits -= 1;
            await organizer.save();
            
            console.log(`✅ Deducted 1 vote credit from ${organizer.username}. Remaining: ${organizer.voteCredits}`);
            
            // Emit credit update to organizer's dashboard
            const io = req.app.get('io');
            io.to(organizer._id.toString()).emit('credits_updated', {
                voteCredits: organizer.voteCredits,
                reason: 'vote_cast',
                electionId: election._id,
                electionTitle: election.title
            });
        }

        // Emit vote update event
        const candidates = await Candidate.find({ election: election._id });
        const totalVotes = await Vote.countDocuments({ election: election._id });

        const io = req.app.get('io');
        io.to(req.params.id).emit('vote_update', {
            candidates,
            totalVotes
        });
        
        // Emit newVote event for real-time updates
        io.emit('newVote', {
            electionId: election._id,
            electionTitle: election.title,
            candidateId: candidate._id,
            totalVotes
        });

        res.status(200).json({ message: 'Vote cast successfully' });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update election
// @route   PUT /api/elections/:id
// @access  Private
exports.updateElection = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);

        if (election) {
            if (election.organizer.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            election.title = req.body.title || election.title;
            election.organization = req.body.organization || election.organization;
            election.description = req.body.description || election.description;
            election.startDate = req.body.startDate || election.startDate;
            election.endDate = req.body.endDate || election.endDate;

            const updatedElection = await election.save();

            // Emit election update event
            const io = req.app.get('io');
            io.to(req.params.id).emit('election_updated', updatedElection);

            res.json(updatedElection);
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Private
exports.deleteElection = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);

        if (election) {
            if (election.organizer.toString() !== req.user._id.toString()) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            await election.deleteOne();

            // Delete related data
            await Candidate.deleteMany({ election: election._id });
            await Vote.deleteMany({ election: election._id });

            res.json({ message: 'Election removed' });
        } else {
            res.status(404).json({ message: 'Election not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check voter eligibility and existing votes
// @route   POST /api/elections/:id/check-eligibility
// @access  Public
exports.checkEligibility = async (req, res) => {
    try {
        const { voterId } = req.body;
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'Election not found' });

        // Check if election is active (strict time enforcement)
        const now = new Date();
        
        // Check if election hasn't started yet
        if (now < new Date(election.startDate)) {
            return res.status(403).json({ 
                message: `Voting hasn't started yet. Voting opens on ${new Date(election.startDate).toLocaleString()}`,
                status: 'upcoming',
                startDate: election.startDate
            });
        }
        
        // Check if election has ended
        if (now > new Date(election.endDate)) {
            return res.status(403).json({ 
                message: `Voting has ended. This election closed on ${new Date(election.endDate).toLocaleString()}`,
                status: 'ended',
                endDate: election.endDate
            });
        }

        // Check whitelist
        const allowedVoterCount = await AllowedVoter.countDocuments({ election: election._id });
        if (allowedVoterCount > 0) {
            const isAllowed = await AllowedVoter.findOne({ election: election._id, studentId: voterId });
            if (!isAllowed) return res.status(403).json({ message: 'You are not on the voter list for this election' });
        }

        // Get existing votes
        const votes = await Vote.find({ election: election._id, voterId });
        const votedPositions = votes.map(v => v.position);

        res.json({ allowed: true, votedPositions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
