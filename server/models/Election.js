const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    organization: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnailUrl: { type: String, default: '' },
    voterLimit: { type: Number, default: -1 }, // -1 means unlimited
    planType: { type: String, enum: ['free', 'starter', 'standard', 'unlimited'], default: 'free' },
    isPublic: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Election', ElectionSchema);
