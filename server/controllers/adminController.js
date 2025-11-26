const User = require('../models/User');
const Election = require('../models/Election');
const { sendEmail } = require('../config/emailService');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        console.log('Fetching all users...');
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        console.log(`Found ${users.length} users`);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['admin', 'organizer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({ message: 'User role updated successfully', user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all elections (Admin only)
// @route   GET /api/admin/elections
// @access  Private/Admin
exports.getAllElections = async (req, res) => {
    try {
        const elections = await Election.find()
            .populate('organizer', 'username email')
            .sort({ createdAt: -1 });
        res.json(elections);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete election (Admin only)
// @route   DELETE /api/admin/elections/:id
// @access  Private/Admin
exports.deleteElection = async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);

        if (!election) {
            return res.status(404).json({ message: 'Election not found' });
        }

        await election.deleteOne();
        res.json({ message: 'Election deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res) => {
    try {
        console.log('Fetching system stats...');
        
        const totalUsers = await User.countDocuments();
        const totalElections = await Election.countDocuments();
        const activeElections = await Election.countDocuments({ status: 'active' });
        
        // Calculate total votes from all elections
        const elections = await Election.find();
        let totalVotes = 0;
        elections.forEach(election => {
            if (election.candidates && Array.isArray(election.candidates)) {
                election.candidates.forEach(candidate => {
                    totalVotes += candidate.voteCount || 0;
                });
            }
        });

        console.log(`Stats: Users=${totalUsers}, Elections=${totalElections}, Active=${activeElections}, Votes=${totalVotes}`);

        res.json({
            totalUsers,
            totalElections,
            activeElections,
            totalVotes
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all transactions (Admin only)
// @route   GET /api/admin/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        
        const { status, startDate, endDate, search } = req.query;
        
        let query = {};
        
        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        // Search by transaction ID or phone
        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const transactions = await Transaction.find(query)
            .populate('userId', 'username email phoneNumber')
            .sort({ createdAt: -1 })
            .limit(1000); // Limit to last 1000 transactions
        
        // Calculate stats
        const stats = {
            total: transactions.length,
            success: transactions.filter(t => t.status === 'Success').length,
            pending: transactions.filter(t => t.status === 'Pending').length,
            failed: transactions.filter(t => t.status === 'Failed').length,
            cancelled: transactions.filter(t => t.status === 'Cancelled').length,
            totalRevenue: transactions
                .filter(t => t.status === 'Success')
                .reduce((sum, t) => sum + t.amount, 0)
        };
        
        res.json({
            success: true,
            transactions,
            stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manually complete transaction (Admin only)
// @route   POST /api/admin/transactions/:id/complete
// @access  Private/Admin
exports.completeTransaction = async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const User = require('../models/User');
        
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        if (transaction.processed) {
            return res.status(400).json({ success: false, message: 'Transaction already processed' });
        }
        
        // Update transaction
        transaction.status = 'Success';
        transaction.processed = true;
        await transaction.save();
        
        // Add credits to user
        if (transaction.userId) {
            const user = await User.findById(transaction.userId);
            
            if (user) {
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
                        paymentDate: transaction.createdAt
                    });
                    
                    // Add vote credits
                    const voteCreditsToAdd = transaction.voterLimit === -1 ? 999999 : transaction.voterLimit;
                    user.addVoteCredits(voteCreditsToAdd);
                    
                    await user.save();
                    
                    console.log(`✅ Admin completed transaction: ${transaction.transactionId}`);
                    console.log(`   Added ${voteCreditsToAdd} vote credits to user ${user.username}`);
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Transaction completed successfully',
            transaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get pricing plans (Admin only)
// @route   GET /api/admin/pricing
// @access  Private/Admin
exports.getPricing = async (req, res) => {
    try {
        const PricingPlan = require('../models/PricingPlan');
        
        // Get all plans from database
        const plans = await PricingPlan.find().sort({ price: 1 });
        
        // If no plans exist, initialize defaults
        if (plans.length === 0) {
            await PricingPlan.initializeDefaultPlans();
            const newPlans = await PricingPlan.find().sort({ price: 1 });
            return res.json({ success: true, plans: newPlans });
        }
        
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update pricing plan (Admin only)
// @route   PUT /api/admin/pricing/:planId
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
    try {
        const PricingPlan = require('../models/PricingPlan');
        const { planId } = req.params;
        const { name, price, voterLimit, enabled, description, features } = req.body;
        
        // Validate price
        if (price !== undefined && price < 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Price cannot be negative' 
            });
        }
        
        // Find and update plan
        const plan = await PricingPlan.findOneAndUpdate(
            { planId },
            {
                ...(name && { name }),
                ...(price !== undefined && { price }),
                ...(voterLimit !== undefined && { voterLimit }),
                ...(enabled !== undefined && { enabled }),
                ...(description && { description }),
                ...(features && { features }),
                updatedBy: req.user._id
            },
            { new: true, runValidators: true }
        );
        
        if (!plan) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pricing plan not found' 
            });
        }
        
        console.log(`✅ Admin ${req.user.username} updated pricing for ${planId}:`, plan);
        
        res.json({
            success: true,
            message: 'Pricing updated successfully',
            plan
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add credits to user (Admin only)
// @route   POST /api/admin/users/:id/credits
// @access  Private/Admin
exports.addUserCredits = async (req, res) => {
    try {
        const { voteCredits, plan, voterLimit } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Add election package
        user.electionCredits.push({
            plan: plan || 'admin_grant',
            voterLimit: voterLimit || voteCredits,
            price: 0,
            transactionId: `ADMIN_${Date.now()}`,
            paymentDate: new Date()
        });
        
        // Add vote credits
        user.addVoteCredits(voteCredits);
        
        await user.save();
        
        console.log(`✅ Admin added ${voteCredits} credits to user ${user.username}`);
        
        res.json({
            success: true,
            message: `Added ${voteCredits} vote credits to user`,
            user: {
                id: user._id,
                username: user.username,
                voteCredits: user.voteCredits
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete transaction (Admin only)
// @route   DELETE /api/admin/transactions/:id
// @access  Private/Admin
exports.deleteTransaction = async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: 'Transaction not found' 
            });
        }

        await transaction.deleteOne();
        
        res.json({ 
            success: true, 
            message: 'Transaction deleted successfully' 
        });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Generate financial report PDF (Accounting Format)
// @route   GET /api/admin/reports/financial
// @access  Private/Admin
exports.generateFinancialReport = async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const Transaction = require('../models/Transaction');
        
        // Get date range from query or default to last 30 days
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Fetch transactions
        const transactions = await Transaction.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).populate('userId', 'username email').sort({ createdAt: 1 });
        
        // Calculate accounting metrics
        const successfulTxs = transactions.filter(t => t.status === 'Success');
        const pendingTxs = transactions.filter(t => t.status === 'Pending');
        const failedTxs = transactions.filter(t => t.status === 'Failed');
        
        const totalRevenue = successfulTxs.reduce((sum, t) => sum + t.amount, 0);
        const pendingAmount = pendingTxs.reduce((sum, t) => sum + t.amount, 0);
        const failedAmount = failedTxs.reduce((sum, t) => sum + t.amount, 0);
        
        // Revenue by plan (Chart of Accounts)
        const planStats = {};
        successfulTxs.forEach(t => {
            const plan = t.plan || 'Unknown';
            if (!planStats[plan]) {
                planStats[plan] = { count: 0, revenue: 0 };
            }
            planStats[plan].count++;
            planStats[plan].revenue += t.amount;
        });
        
        // Daily revenue breakdown
        const dailyRevenue = {};
        successfulTxs.forEach(t => {
            const date = new Date(t.createdAt).toLocaleDateString();
            dailyRevenue[date] = (dailyRevenue[date] || 0) + t.amount;
        });
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=financial-report-${Date.now()}.pdf`);
        
        doc.pipe(res);
        
        // HEADER - Company Info
        doc.fontSize(20).font('Helvetica-Bold').text('POLLSYNC VOTING PLATFORM', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('kingscreation.co.ke', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica-Bold').text('FINANCIAL STATEMENT', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(`Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // INCOME STATEMENT
        doc.fontSize(14).font('Helvetica-Bold').text('INCOME STATEMENT');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        
        doc.fontSize(11).font('Helvetica-Bold').text('REVENUE');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        
        // Revenue by Plan (Chart of Accounts)
        let yPos = doc.y;
        Object.entries(planStats).forEach(([plan, data]) => {
            doc.text(`  ${plan} Plan Revenue`, 70, yPos);
            doc.text(`KES ${data.revenue.toLocaleString()}`, 400, yPos, { align: 'right', width: 150 });
            yPos = doc.y + 5;
        });
        
        doc.moveDown(0.5);
        doc.moveTo(400, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Total Revenue', 70);
        doc.text(`KES ${totalRevenue.toLocaleString()}`, 400, doc.y - 12, { align: 'right', width: 150 });
        doc.moveDown(1);
        
        // ACCOUNTS RECEIVABLE
        doc.fontSize(11).font('Helvetica-Bold').text('ACCOUNTS RECEIVABLE');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        doc.text(`  Pending Transactions (${pendingTxs.length})`, 70);
        doc.text(`KES ${pendingAmount.toLocaleString()}`, 400, doc.y - 12, { align: 'right', width: 150 });
        doc.moveDown(1);
        
        // WRITE-OFFS / BAD DEBT
        doc.fontSize(11).font('Helvetica-Bold').text('WRITE-OFFS');
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica');
        doc.text(`  Failed Transactions (${failedTxs.length})`, 70);
        doc.text(`KES ${failedAmount.toLocaleString()}`, 400, doc.y - 12, { align: 'right', width: 150 });
        doc.moveDown(1);
        
        // NET INCOME
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('NET INCOME', 70);
        doc.text(`KES ${totalRevenue.toLocaleString()}`, 400, doc.y - 14, { align: 'right', width: 150 });
        doc.moveTo(400, doc.y).lineTo(550, doc.y).stroke();
        doc.moveTo(400, doc.y + 2).lineTo(550, doc.y + 2).stroke();
        doc.moveDown(2);
        
        // TRANSACTION SUMMARY
        doc.fontSize(14).font('Helvetica-Bold').text('TRANSACTION SUMMARY');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        
        doc.fontSize(10).font('Helvetica');
        const summaryY = doc.y;
        doc.text('Total Transactions:', 70, summaryY);
        doc.text(transactions.length.toString(), 250, summaryY);
        doc.text('Successful:', 320, summaryY);
        doc.text(`${successfulTxs.length} (${((successfulTxs.length / transactions.length) * 100).toFixed(1)}%)`, 420, summaryY);
        
        doc.moveDown();
        const summaryY2 = doc.y;
        doc.text('Pending:', 70, summaryY2);
        doc.text(pendingTxs.length.toString(), 250, summaryY2);
        doc.text('Failed:', 320, summaryY2);
        doc.text(failedTxs.length.toString(), 420, summaryY2);
        doc.moveDown(2);
        
        // DAILY REVENUE BREAKDOWN
        if (Object.keys(dailyRevenue).length > 0) {
            doc.addPage();
            doc.fontSize(14).font('Helvetica-Bold').text('DAILY REVENUE BREAKDOWN');
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1);
            
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Date', 70);
            doc.text('Revenue', 400, doc.y - 12, { align: 'right', width: 150 });
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);
            
            doc.font('Helvetica');
            Object.entries(dailyRevenue).forEach(([date, amount]) => {
                doc.text(date, 70);
                doc.text(`KES ${amount.toLocaleString()}`, 400, doc.y - 12, { align: 'right', width: 150 });
                doc.moveDown(0.3);
            });
        }
        
        // DETAILED TRANSACTION LEDGER
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('TRANSACTION LEDGER');
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
        
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Date', 50);
        doc.text('Ref#', 110);
        doc.text('Description', 200);
        doc.text('Debit', 380);
        doc.text('Credit', 450);
        doc.text('Balance', 500);
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        
        doc.font('Helvetica');
        let runningBalance = 0;
        
        successfulTxs.slice(0, 100).forEach(tx => {
            if (doc.y > 720) {
                doc.addPage();
                doc.fontSize(9).font('Helvetica');
            }
            
            runningBalance += tx.amount;
            const date = new Date(tx.createdAt).toLocaleDateString();
            const ref = tx.transactionId.substring(0, 10);
            const desc = `${tx.plan || 'N/A'} - ${tx.userId?.username || 'Guest'}`;
            
            doc.text(date, 50);
            doc.text(ref, 110);
            doc.text(desc.substring(0, 25), 200);
            doc.text('-', 380);
            doc.text(`${tx.amount}`, 450);
            doc.text(`${runningBalance.toLocaleString()}`, 500);
            doc.moveDown(0.3);
        });
        
        if (successfulTxs.length > 100) {
            doc.moveDown();
            doc.fontSize(8).text(`... ${successfulTxs.length - 100} more transactions`, { align: 'center' });
        }
        
        // FOOTER
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').text('This is a computer-generated report and does not require a signature.', { align: 'center' });
        doc.text('For inquiries, contact: kingscreation.co.ke', { align: 'center' });
        
        doc.end();
    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Backup all system data
// @route   GET /api/admin/backup
// @access  Private/Admin
exports.backupSystemData = async (req, res) => {
    try {
        const Election = require('../models/Election');
        const Vote = require('../models/Vote');
        const Transaction = require('../models/Transaction');
        
        console.log('Starting system backup...');
        
        // Fetch all data
        const [users, elections, votes, transactions] = await Promise.all([
            User.find().select('-password').lean(),
            Election.find().populate('organizer', 'username email').lean(),
            Vote.find().populate('voter', 'username email').populate('election', 'title').lean(),
            Transaction.find().populate('userId', 'username email').lean()
        ]);
        
        // Create backup object
        const backup = {
            metadata: {
                backupDate: new Date().toISOString(),
                version: '1.0',
                recordCounts: {
                    users: users.length,
                    elections: elections.length,
                    votes: votes.length,
                    transactions: transactions.length
                }
            },
            data: {
                users,
                elections,
                votes,
                transactions
            }
        };
        
        // Set response headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=pollsync-backup-${Date.now()}.json`);
        
        res.json(backup);
        
        console.log('Backup completed successfully');
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get election votes details
// @route   GET /api/admin/elections/:id/votes
// @access  Private/Admin
exports.getElectionVotes = async (req, res) => {
    try {
        const Election = require('../models/Election');
        const Vote = require('../models/Vote');
        
        const election = await Election.findById(req.params.id)
            .populate('organizer', 'username email')
            .populate('candidates.candidate', 'name');
        
        if (!election) {
            return res.status(404).json({ success: false, message: 'Election not found' });
        }
        
        // Get all votes for this election
        const votes = await Vote.find({ election: req.params.id })
            .populate('voter', 'username email phoneNumber')
            .populate('candidate', 'name')
            .sort({ createdAt: -1 });
        
        // Calculate vote counts per candidate
        const voteCounts = {};
        votes.forEach(vote => {
            const candidateId = vote.candidate._id.toString();
            voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
        });
        
        // Add vote counts to candidates
        const candidatesWithVotes = election.candidates.map(c => ({
            ...c.toObject(),
            voteCount: voteCounts[c.candidate._id.toString()] || 0
        }));
        
        res.json({
            success: true,
            election: {
                ...election.toObject(),
                candidates: candidatesWithVotes
            },
            votes,
            totalVotes: votes.length
        });
    } catch (error) {
        console.error('Get election votes error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Export election report to Excel
// @route   GET /api/admin/elections/:id/export
// @access  Private/Admin
exports.exportElectionReport = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const Election = require('../models/Election');
        const Vote = require('../models/Vote');
        
        const election = await Election.findById(req.params.id)
            .populate('organizer', 'username email')
            .populate('candidates.candidate', 'name');
        
        if (!election) {
            return res.status(404).json({ success: false, message: 'Election not found' });
        }
        
        // Get all votes
        const votes = await Vote.find({ election: req.params.id })
            .populate('voter', 'username email phoneNumber')
            .populate('candidate', 'name')
            .sort({ createdAt: 1 });
        
        // Calculate results
        const voteCounts = {};
        votes.forEach(vote => {
            const candidateId = vote.candidate._id.toString();
            voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
        });
        
        const candidatesWithVotes = election.candidates.map(c => ({
            name: c.candidate.name,
            party: c.party || 'Independent',
            voteCount: voteCounts[c.candidate._id.toString()] || 0,
            percentage: votes.length > 0 ? ((voteCounts[c.candidate._id.toString()] || 0) / votes.length * 100).toFixed(2) : 0
        })).sort((a, b) => b.voteCount - a.voteCount);
        
        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'PollSync Admin';
        workbook.created = new Date();
        
        // SHEET 1: Election Summary
        const summarySheet = workbook.addWorksheet('Election Summary');
        
        // Header styling
        summarySheet.getCell('A1').value = 'POLLSYNC ELECTION REPORT';
        summarySheet.getCell('A1').font = { size: 16, bold: true };
        summarySheet.mergeCells('A1:D1');
        
        summarySheet.getCell('A2').value = 'kingscreation.co.ke';
        summarySheet.mergeCells('A2:D2');
        
        // Election Details
        summarySheet.addRow([]);
        summarySheet.addRow(['Election Details']);
        summarySheet.getCell('A4').font = { bold: true, size: 12 };
        
        summarySheet.addRow(['Title:', election.title]);
        summarySheet.addRow(['Organization:', election.organization]);
        summarySheet.addRow(['Organizer:', election.organizer?.username || 'N/A']);
        summarySheet.addRow(['Status:', election.status]);
        summarySheet.addRow(['Start Date:', new Date(election.startDate).toLocaleString()]);
        summarySheet.addRow(['End Date:', new Date(election.endDate).toLocaleString()]);
        summarySheet.addRow(['Total Votes:', votes.length]);
        summarySheet.addRow(['Total Candidates:', election.candidates.length]);
        summarySheet.addRow(['Report Generated:', new Date().toLocaleString()]);
        
        // Style the details
        for (let i = 5; i <= 12; i++) {
            summarySheet.getCell(`A${i}`).font = { bold: true };
        }
        
        // SHEET 2: Results
        const resultsSheet = workbook.addWorksheet('Results');
        
        resultsSheet.getCell('A1').value = 'ELECTION RESULTS';
        resultsSheet.getCell('A1').font = { size: 14, bold: true };
        resultsSheet.mergeCells('A1:E1');
        
        resultsSheet.addRow([]);
        
        // Results header
        const headerRow = resultsSheet.addRow(['Rank', 'Candidate Name', 'Party', 'Votes', 'Percentage']);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Results data
        candidatesWithVotes.forEach((candidate, index) => {
            const row = resultsSheet.addRow([
                index + 1,
                candidate.name,
                candidate.party,
                candidate.voteCount,
                `${candidate.percentage}%`
            ]);
            
            // Highlight winner
            if (index === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD4EDDA' }
                };
                row.font = { bold: true };
            }
        });
        
        // Column widths
        resultsSheet.getColumn(1).width = 8;
        resultsSheet.getColumn(2).width = 30;
        resultsSheet.getColumn(3).width = 20;
        resultsSheet.getColumn(4).width = 12;
        resultsSheet.getColumn(5).width = 12;
        
        // SHEET 3: Vote Details
        const votesSheet = workbook.addWorksheet('Vote Details');
        
        votesSheet.getCell('A1').value = 'INDIVIDUAL VOTES';
        votesSheet.getCell('A1').font = { size: 14, bold: true };
        votesSheet.mergeCells('A1:E1');
        
        votesSheet.addRow([]);
        
        // Votes header
        const votesHeaderRow = votesSheet.addRow(['#', 'Voter Name', 'Voter Email', 'Candidate', 'Timestamp']);
        votesHeaderRow.font = { bold: true };
        votesHeaderRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF70AD47' }
        };
        votesHeaderRow.eachCell(cell => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Votes data
        votes.forEach((vote, index) => {
            votesSheet.addRow([
                index + 1,
                vote.voter?.username || 'Anonymous',
                vote.voter?.email || 'N/A',
                vote.candidate?.name || 'N/A',
                new Date(vote.createdAt).toLocaleString()
            ]);
        });
        
        // Column widths
        votesSheet.getColumn(1).width = 8;
        votesSheet.getColumn(2).width = 20;
        votesSheet.getColumn(3).width = 30;
        votesSheet.getColumn(4).width = 25;
        votesSheet.getColumn(5).width = 20;
        
        // SHEET 4: Statistics
        const statsSheet = workbook.addWorksheet('Statistics');
        
        statsSheet.getCell('A1').value = 'ELECTION STATISTICS';
        statsSheet.getCell('A1').font = { size: 14, bold: true };
        statsSheet.mergeCells('A1:C1');
        
        statsSheet.addRow([]);
        statsSheet.addRow(['Metric', 'Value', 'Percentage']);
        statsSheet.getRow(3).font = { bold: true };
        
        // Calculate stats
        const totalVoters = votes.length;
        const uniqueVoters = new Set(votes.map(v => v.voter?._id?.toString())).size;
        
        statsSheet.addRow(['Total Votes Cast', totalVoters, '100%']);
        statsSheet.addRow(['Unique Voters', uniqueVoters, `${((uniqueVoters / totalVoters) * 100).toFixed(1)}%`]);
        statsSheet.addRow(['Total Candidates', election.candidates.length, '-']);
        statsSheet.addRow(['Winner', candidatesWithVotes[0]?.name || 'N/A', `${candidatesWithVotes[0]?.percentage}%`]);
        statsSheet.addRow(['Runner-up', candidatesWithVotes[1]?.name || 'N/A', `${candidatesWithVotes[1]?.percentage || 0}%`]);
        
        // Voting timeline
        if (votes.length > 0) {
            const firstVote = new Date(votes[0].createdAt);
            const lastVote = new Date(votes[votes.length - 1].createdAt);
            const duration = (lastVote - firstVote) / (1000 * 60 * 60); // hours
            
            statsSheet.addRow([]);
            statsSheet.addRow(['First Vote', firstVote.toLocaleString(), '-']);
            statsSheet.addRow(['Last Vote', lastVote.toLocaleString(), '-']);
            statsSheet.addRow(['Voting Duration', `${duration.toFixed(1)} hours`, '-']);
        }
        
        // Column widths
        statsSheet.getColumn(1).width = 25;
        statsSheet.getColumn(2).width = 30;
        statsSheet.getColumn(3).width = 15;
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=election-report-${election.title.replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
        
        // Write to response
        await workbook.xlsx.write(res);
        res.end();
        
    } catch (error) {
        console.error('Export election error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send bulk email to all users (Admin only)
// @route   POST /api/admin/send-bulk-email
// @access  Private/Admin
exports.sendBulkEmail = async (req, res) => {
    try {
        const { subject, message, htmlMessage, targetUsers } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Subject and message are required' 
            });
        }

        // Get target users
        let users;
        if (targetUsers === 'all') {
            users = await User.find().select('email username');
        } else if (targetUsers === 'organizers') {
            users = await User.find({ role: 'organizer' }).select('email username');
        } else if (targetUsers === 'admins') {
            users = await User.find({ role: 'admin' }).select('email username');
        } else {
            users = await User.find().select('email username');
        }

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'No users found' 
            });
        }

        console.log(`📧 Admin sending bulk email to ${users.length} users...`);

        // Prepare HTML message
        const htmlContent = htmlMessage || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">PollSync</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
                    <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        This email was sent by PollSync Admin<br>
                        <a href="https://kingscreation.co.ke" style="color: #667eea; text-decoration: none;">kingscreation.co.ke</a>
                    </p>
                </div>
            </div>
        `;

        // Send emails in batches to avoid overwhelming the server
        const batchSize = 50;
        const results = {
            total: users.length,
            sent: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            const promises = batch.map(user => 
                sendEmail({
                    to: user.email,
                    subject: subject,
                    html: htmlContent,
                    text: message
                }).catch(error => {
                    console.error(`Failed to send to ${user.email}:`, error.message);
                    return { success: false, error: error.message, email: user.email };
                })
            );

            const batchResults = await Promise.allSettled(promises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success !== false) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push({
                        email: batch[index].email,
                        error: result.reason?.message || result.value?.error || 'Unknown error'
                    });
                }
            });

            // Small delay between batches
            if (i + batchSize < users.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Bulk email complete: ${results.sent} sent, ${results.failed} failed`);

        res.json({
            success: true,
            message: `Email sent to ${results.sent} users`,
            results: {
                total: results.total,
                sent: results.sent,
                failed: results.failed,
                successRate: `${((results.sent / results.total) * 100).toFixed(1)}%`
            },
            errors: results.errors.length > 0 ? results.errors.slice(0, 10) : [] // Return first 10 errors
        });

    } catch (error) {
        console.error('Bulk email error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get email statistics (Admin only)
// @route   GET /api/admin/email-stats
// @access  Private/Admin
exports.getEmailStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: '' } });
        const organizers = await User.countDocuments({ role: 'organizer' });
        const admins = await User.countDocuments({ role: 'admin' });

        res.json({
            success: true,
            stats: {
                totalUsers,
                usersWithEmail,
                organizers,
                admins,
                targetGroups: [
                    { value: 'all', label: 'All Users', count: usersWithEmail },
                    { value: 'organizers', label: 'Organizers Only', count: organizers },
                    { value: 'admins', label: 'Admins Only', count: admins }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};
