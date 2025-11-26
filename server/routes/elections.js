const express = require('express');
const router = express.Router();
const { createElection, getElections, getElectionById, addCandidate, vote, updateElection, deleteElection, checkEligibility } = require('../controllers/electionController');
const { addPackageToElection, getElectionPackages } = require('../controllers/electionTopUpController');
const { protect } = require('../middleware/authMiddleware');
const { requireElectionCredit } = require('../middleware/electionCreditMiddleware');

router.route('/')
    .post(protect, requireElectionCredit, createElection)
    .get(protect, getElections);

router.route('/:id')
    .get(getElectionById)
    .put(protect, updateElection)
    .delete(protect, deleteElection);

router.use('/:id/voters', require('./voters'));

router.route('/:id/candidates')
    .post(protect, addCandidate);

router.post('/:id/vote', vote);
router.post('/:id/check-eligibility', checkEligibility);

// Package management routes
router.get('/:id/packages', protect, getElectionPackages);
router.post('/:id/add-package', protect, addPackageToElection);

module.exports = router;
