const express = require('express');
const router = express.Router();
const PricingPlan = require('../models/PricingPlan');

// @desc    Get all active pricing plans (Public)
// @route   GET /api/pricing
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Get all active plans
        let plans = await PricingPlan.getActivePlans();
        
        // If no plans exist, initialize defaults
        if (plans.length === 0) {
            await PricingPlan.initializeDefaultPlans();
            plans = await PricingPlan.getActivePlans();
        }
        
        res.json({ 
            success: true, 
            plans: plans.map(plan => ({
                planId: plan.planId,
                name: plan.name,
                price: plan.price,
                voterLimit: plan.voterLimit,
                currency: plan.currency,
                description: plan.description,
                features: plan.features
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get specific plan by ID (Public)
// @route   GET /api/pricing/:planId
// @access  Public
router.get('/:planId', async (req, res) => {
    try {
        const plan = await PricingPlan.getPlanById(req.params.planId);
        
        if (!plan) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pricing plan not found' 
            });
        }
        
        res.json({ 
            success: true, 
            plan: {
                planId: plan.planId,
                name: plan.name,
                price: plan.price,
                voterLimit: plan.voterLimit,
                currency: plan.currency,
                description: plan.description,
                features: plan.features
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
