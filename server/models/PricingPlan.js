const mongoose = require('mongoose');

const pricingPlanSchema = new mongoose.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
        enum: ['free', 'starter', 'standard', 'unlimited']
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    voterLimit: {
        type: Number,
        required: true,
        default: -1 // -1 means unlimited
    },
    currency: {
        type: String,
        default: 'KES'
    },
    enabled: {
        type: Boolean,
        default: true
    },
    features: [{
        type: String
    }],
    description: {
        type: String
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Static method to get all active plans
pricingPlanSchema.statics.getActivePlans = async function() {
    return await this.find({ enabled: true }).sort({ price: 1 });
};

// Static method to get plan by ID
pricingPlanSchema.statics.getPlanById = async function(planId) {
    return await this.findOne({ planId, enabled: true });
};

// Static method to initialize default plans
pricingPlanSchema.statics.initializeDefaultPlans = async function() {
    const defaultPlans = [
        {
            planId: 'free',
            name: 'Free Trial',
            price: 5,
            voterLimit: 10,
            currency: 'KES',
            enabled: true,
            description: 'Perfect for testing',
            features: ['Up to 10 voters', 'Basic analytics', 'Email support']
        },
        {
            planId: 'starter',
            name: 'Starter',
            price: 500,
            voterLimit: 50,
            currency: 'KES',
            enabled: true,
            description: 'Great for small elections',
            features: ['Up to 50 voters', 'Advanced analytics', 'Priority support', 'Custom branding']
        },
        {
            planId: 'standard',
            name: 'Standard',
            price: 1500,
            voterLimit: 200,
            currency: 'KES',
            enabled: true,
            description: 'Ideal for medium elections',
            features: ['Up to 200 voters', 'Full analytics', 'Priority support', 'Custom branding', 'Export reports']
        },
        {
            planId: 'unlimited',
            name: 'Unlimited',
            price: 3000,
            voterLimit: -1,
            currency: 'KES',
            enabled: true,
            description: 'For large-scale elections',
            features: ['Unlimited voters', 'Full analytics', '24/7 support', 'Custom branding', 'Export reports', 'API access']
        }
    ];

    for (const plan of defaultPlans) {
        await this.findOneAndUpdate(
            { planId: plan.planId },
            plan,
            { upsert: true, new: true }
        );
    }

    console.log('✅ Default pricing plans initialized');
};

module.exports = mongoose.model('PricingPlan', pricingPlanSchema);
