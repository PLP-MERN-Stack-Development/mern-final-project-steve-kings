const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    organization: { type: String, required: true }, // Organization name (kept for backward compatibility)
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // Reference to Organization model
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnailUrl: { type: String, default: '' },
    voterLimit: { type: Number, default: -1 }, // -1 means unlimited
    planType: { type: String, enum: ['free', 'starter', 'standard', 'unlimited'], default: 'free' },
    isPublic: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    // Multiple packages can be assigned to one election
    packages: [{
        packageName: { type: String, default: '' }, // e.g., 'Starter', 'Standard'
        credits: { type: Number, default: 0 }, // Credits from this package
        transactionId: { type: String, default: '' }, // Transaction ID
        addedDate: { type: Date, default: Date.now }
    }],
    // Legacy fields (for backward compatibility)
    packageUsed: { type: String, default: '' },
    creditsUsed: { type: Number, default: 0 },
    transactionId: { type: String, default: '' },
    // Inquiry/Contact Information
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

// Virtual field: Calculate total credits from all packages
ElectionSchema.virtual('totalCredits').get(function() {
    if (this.packages && this.packages.length > 0) {
        return this.packages.reduce((sum, pkg) => {
            return sum + (pkg.credits === -1 ? 999999 : pkg.credits);
        }, 0);
    }
    // Fallback to legacy field
    return this.creditsUsed || (this.voterLimit === -1 ? 999999 : this.voterLimit);
});

// Virtual field: Check if election has unlimited credits
ElectionSchema.virtual('hasUnlimitedCredits').get(function() {
    if (this.packages && this.packages.length > 0) {
        return this.packages.some(pkg => pkg.credits === -1);
    }
    return this.voterLimit === -1;
});

// Ensure virtuals are included in JSON
ElectionSchema.set('toJSON', { virtuals: true });
ElectionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Election', ElectionSchema);
