const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization
} = require('../controllers/organizationController');

router.route('/')
    .get(protect, getOrganizations)
    .post(protect, createOrganization);

router.route('/:id')
    .get(protect, getOrganizationById)
    .put(protect, updateOrganization)
    .delete(protect, deleteOrganization);

module.exports = router;
