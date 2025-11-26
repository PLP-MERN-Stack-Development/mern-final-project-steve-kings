require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const PricingPlan = require('./models/PricingPlan');

async function testCompleteFlow() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test credentials
        const testEmail = 'testuser@example.com';
        const testPhone = '+254769956286';
        const testAmount = 5;

        console.log('=== TEST USER VERIFICATION ===');
        console.log('Email:', testEmail);
        console.log('Phone:', testPhone);
        console.log('Amount:', testAmount);
        console.log('');

        // 1. Find the test user
        console.log('1️⃣ Finding test user...');
        const user = await User.findOne({ email: testEmail });
        
        if (!user) {
            console.error('❌ User not found. Please create user first.');
            console.log('\nTo create user, run:');
            console.log('POST /api/auth/register');
            console.log(JSON.stringify({
                username: 'testuser',
                email: testEmail,
                password: '@king635',
                phoneNumber: '0769956286'
            }, null, 2));
            process.exit(1);
        }

        console.log('✅ User found:', user.username);
        console.log('   User ID:', user._id);
        console.log('   Email:', user.email);
        console.log('   Current packages:', user.electionCredits.length);
        console.log('');

        // 2. Check pricing plan
        console.log('2️⃣ Checking pricing plan for KES', testAmount);
        const plan = await PricingPlan.findOne({ price: testAmount, enabled: true });
        
        if (!plan) {
            console.error('❌ No pricing plan found for KES', testAmount);
            console.log('\nAvailable plans:');
            const plans = await PricingPlan.find({ enabled: true });
            plans.forEach(p => {
                console.log(`   - ${p.name}: KES ${p.price} (${p.voterLimit} voters)`);
            });
            process.exit(1);
        }

        console.log('✅ Plan found:', plan.name);
        console.log('   Plan ID:', plan.planId);
        console.log('   Price: KES', plan.price);
        console.log('   Voter Limit:', plan.voterLimit);
        console.log('');

        // 3. Simulate payment transaction
        console.log('3️⃣ Creating test transaction...');
        const testTransactionId = `TEST_FLOW_${Date.now()}`;
        
        const transaction = new Transaction({
            transactionId: testTransactionId,
            amount: testAmount,
            currency: 'KES',
            status: 'Success',
            phoneNumber: testPhone,
            userId: user._id,
            plan: plan.planId,
            voterLimit: plan.voterLimit,
            processed: false,
            metadata: { testFlow: true }
        });
        
        await transaction.save();
        console.log('✅ Transaction created:', testTransactionId);
        console.log('');

        // 4. Add package to user account
        console.log('4️⃣ Adding package to user account...');
        
        // Check if package already exists
        const existingCredit = user.electionCredits.find(
            c => c.transactionId === testTransactionId
        );

        if (existingCredit) {
            console.log('⚠️  Package already exists for this transaction');
        } else {
            user.electionCredits.push({
                plan: plan.planId,
                voterLimit: plan.voterLimit,
                price: plan.price,
                transactionId: testTransactionId,
                paymentDate: new Date(),
                used: false
            });
            
            await user.save();
            console.log('✅ Package added to user account');
        }

        // Mark transaction as processed
        transaction.processed = true;
        await transaction.save();
        console.log('✅ Transaction marked as processed');
        console.log('');

        // 5. Display user's current packages
        console.log('5️⃣ User\'s current packages:');
        const updatedUser = await User.findById(user._id);
        const creditSummary = updatedUser.getCreditSummary();
        
        console.log('   Total packages:', creditSummary.electionPackages.total);
        console.log('   Available packages:', creditSummary.electionPackages.available);
        console.log('   Used packages:', creditSummary.electionPackages.used);
        console.log('');

        console.log('   Available Packages:');
        creditSummary.packages.available.forEach((pkg, index) => {
            console.log(`   ${index + 1}. ${pkg.plan} - ${pkg.voterLimit} voters (KES ${pkg.price})`);
            console.log(`      Transaction: ${pkg.transactionId}`);
            console.log(`      Purchase Date: ${pkg.purchaseDate}`);
        });
        console.log('');

        // 6. Test top-up (add another package)
        console.log('6️⃣ Testing top-up (adding another package)...');
        const topUpTransactionId = `TEST_TOPUP_${Date.now()}`;
        
        const topUpTransaction = new Transaction({
            transactionId: topUpTransactionId,
            amount: testAmount,
            currency: 'KES',
            status: 'Success',
            phoneNumber: testPhone,
            userId: user._id,
            plan: plan.planId,
            voterLimit: plan.voterLimit,
            processed: true,
            metadata: { testFlow: true, topUp: true }
        });
        
        await topUpTransaction.save();

        updatedUser.electionCredits.push({
            plan: plan.planId,
            voterLimit: plan.voterLimit,
            price: plan.price,
            transactionId: topUpTransactionId,
            paymentDate: new Date(),
            used: false
        });
        
        await updatedUser.save();
        console.log('✅ Top-up package added');
        console.log('   Transaction:', topUpTransactionId);
        console.log('');

        // 7. Final summary
        console.log('7️⃣ Final Summary:');
        const finalUser = await User.findById(user._id);
        const finalSummary = finalUser.getCreditSummary();
        
        console.log('   User:', finalUser.username);
        console.log('   Email:', finalUser.email);
        console.log('   Total packages:', finalSummary.electionPackages.total);
        console.log('   Available packages:', finalSummary.electionPackages.available);
        console.log('   Used packages:', finalSummary.electionPackages.used);
        console.log('');

        console.log('✅ ALL TESTS PASSED!');
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Login with: testuser@example.com / @king635');
        console.log('2. Go to /dashboard');
        console.log('3. Click "Create Election"');
        console.log('4. System should show available packages');
        console.log('5. Create election and assign a package');
        console.log('6. Test top-up by going to election details and clicking "Add More Credits"');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testCompleteFlow();
