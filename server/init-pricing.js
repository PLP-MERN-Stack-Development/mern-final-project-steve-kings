require('dotenv').config();
const mongoose = require('mongoose');
const PricingPlan = require('./models/PricingPlan');

async function initializePricing() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('💰 Initializing pricing plans...');
        await PricingPlan.initializeDefaultPlans();

        const plans = await PricingPlan.find().sort({ price: 1 });
        
        console.log('\n📊 Current Pricing Plans:');
        console.log('═'.repeat(80));
        
        plans.forEach(plan => {
            console.log(`\n${plan.name.toUpperCase()} (${plan.planId})`);
            console.log(`  Price: ${plan.currency} ${plan.price}`);
            console.log(`  Voters: ${plan.voterLimit === -1 ? 'Unlimited' : plan.voterLimit}`);
            console.log(`  Status: ${plan.enabled ? '✓ Active' : '✗ Disabled'}`);
            console.log(`  Description: ${plan.description}`);
            if (plan.features && plan.features.length > 0) {
                console.log(`  Features:`);
                plan.features.forEach(f => console.log(`    - ${f}`));
            }
        });
        
        console.log('\n' + '═'.repeat(80));
        console.log('✅ Pricing initialization complete!');
        console.log('\n💡 Admins can now manage pricing at: /admin/pricing');
        console.log('💡 Users will see updated prices at: /pricing');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing pricing:', error);
        process.exit(1);
    }
}

initializePricing();
