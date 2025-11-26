const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    deleteUser,
    updateUserRole,
    getAllElections,
    deleteElection,
    getSystemStats,
    getAllTransactions,
    completeTransaction,
    deleteTransaction,
    getPricing,
    updatePricing,
    addUserCredits,
    generateFinancialReport,
    backupSystemData,
    getElectionVotes,
    exportElectionReport,
    sendBulkEmail,
    getEmailStats
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Protect all routes and require admin role
router.use(protect);
router.use(admin);

// User management routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);

// Election management routes
router.get('/elections', getAllElections);
router.delete('/elections/:id', deleteElection);

// Statistics route
router.get('/stats', getSystemStats);

// Transaction management routes
router.get('/transactions', getAllTransactions);
router.post('/transactions/:id/complete', completeTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Pricing management routes
router.get('/pricing', getPricing);
router.put('/pricing/:planId', updatePricing);

// User credit management
router.post('/users/:id/credits', addUserCredits);

// Reports and backup
router.get('/reports/financial', generateFinancialReport);
router.get('/backup', backupSystemData);

// Election votes and export
router.get('/elections/:id/votes', getElectionVotes);
router.get('/elections/:id/export', exportElectionReport);

// Bulk email routes
router.post('/send-bulk-email', sendBulkEmail);
router.get('/email-stats', getEmailStats);

module.exports = router;
