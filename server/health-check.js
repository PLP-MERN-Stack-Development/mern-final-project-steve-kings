// Quick health check script
console.log('🔍 Checking server health...\n');

// Check Node version
console.log('✅ Node version:', process.version);

// Check required modules
const requiredModules = [
    'express',
    'mongoose',
    'socket.io',
    'axios',
    'bcryptjs',
    'jsonwebtoken',
    'cors',
    'dotenv',
    'multer',
    'cloudinary'
];

let allModulesPresent = true;

requiredModules.forEach(module => {
    try {
        require.resolve(module);
        console.log(`✅ ${module} - installed`);
    } catch (e) {
        console.log(`❌ ${module} - MISSING`);
        allModulesPresent = false;
    }
});

// Check environment variables
console.log('\n🔍 Checking environment variables...');
require('dotenv').config();

const requiredEnvVars = [
    'MONGO_URI',
    'JWT_SECRET',
    'PORT'
];

const optionalEnvVars = [
    'KOPOKOPO_CLIENT_ID',
    'KOPOKOPO_CLIENT_SECRET',
    'KOPOKOPO_CALLBACK_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

let allEnvVarsPresent = true;

requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} - set`);
    } else {
        console.log(`❌ ${varName} - MISSING`);
        allEnvVarsPresent = false;
    }
});

console.log('\n🔍 Optional environment variables:');
optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} - set`);
    } else {
        console.log(`⚠️  ${varName} - not set (will use test mode)`);
    }
});

// Check models
console.log('\n🔍 Checking models...');
try {
    require('./models/User');
    console.log('✅ User model - OK');
} catch (e) {
    console.log('❌ User model - ERROR:', e.message);
    allModulesPresent = false;
}

try {
    require('./models/Transaction');
    console.log('✅ Transaction model - OK');
} catch (e) {
    console.log('❌ Transaction model - ERROR:', e.message);
    allModulesPresent = false;
}

// Check controllers
console.log('\n🔍 Checking controllers...');
try {
    require('./controllers/kopokopoController');
    console.log('✅ Kopokopo controller - OK');
} catch (e) {
    console.log('❌ Kopokopo controller - ERROR:', e.message);
    allModulesPresent = false;
}

// Check routes
console.log('\n🔍 Checking routes...');
try {
    require('./routes/payment');
    console.log('✅ Payment routes - OK');
} catch (e) {
    console.log('❌ Payment routes - ERROR:', e.message);
    allModulesPresent = false;
}

// Final verdict
console.log('\n' + '='.repeat(50));
if (allModulesPresent && allEnvVarsPresent) {
    console.log('✅ SERVER IS HEALTHY - Ready to start!');
    console.log('='.repeat(50));
    console.log('\nRun: npm run dev');
    process.exit(0);
} else {
    console.log('❌ SERVER HAS ISSUES - Fix errors above');
    console.log('='.repeat(50));
    if (!allModulesPresent) {
        console.log('\n📦 Install missing modules: npm install');
    }
    if (!allEnvVarsPresent) {
        console.log('\n⚙️  Set missing environment variables in .env file');
    }
    process.exit(1);
}
