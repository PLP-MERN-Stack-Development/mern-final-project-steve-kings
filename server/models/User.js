const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'organizer', 'voter'],
        default: 'organizer'
    },
    subscriptionStatus: {
        type: String,
        enum: ['free', 'premium'],
        default: 'free'
    },
    electionCredits: [{
        plan: {
            type: String,
            enum: ['free', 'starter', 'standard', 'unlimited'],
            required: true
        },
        voterLimit: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        transactionId: {
            type: String,
            default: ''
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        purchaseDate: {
            type: Date,
            default: Date.now
        },
        used: {
            type: Boolean,
            default: false
        },
        electionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Election',
            default: null
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
