const Organization = require('../models/Organization');

// @desc    Get all organizations for current user
// @route   GET /api/organizations
// @access  Private
exports.getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        }).sort({ createdAt: -1 });

        res.json(organizations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get organization by ID
// @route   GET /api/organizations/:id
// @access  Private
exports.getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id)
            .populate('owner', 'username email')
            .populate('members', 'username email');

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json(organization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new organization
// @route   POST /api/organizations
// @access  Private
exports.createOrganization = async (req, res) => {
    try {
        const { name, description, logo, website, email, phone, address } = req.body;

        // Check if organization name already exists
        const existingOrg = await Organization.findOne({ name });
        if (existingOrg) {
            return res.status(400).json({ message: 'Organization name already exists' });
        }

        const organization = new Organization({
            name,
            description,
            logo,
            website,
            email,
            phone,
            address,
            owner: req.user._id,
            members: [req.user._id]
        });

        await organization.save();
        res.status(201).json(organization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private
exports.updateOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if user is owner
        if (organization.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this organization' });
        }

        const { name, description, logo, website, email, phone, address } = req.body;

        organization.name = name || organization.name;
        organization.description = description !== undefined ? description : organization.description;
        organization.logo = logo !== undefined ? logo : organization.logo;
        organization.website = website !== undefined ? website : organization.website;
        organization.email = email !== undefined ? email : organization.email;
        organization.phone = phone !== undefined ? phone : organization.phone;
        organization.address = address !== undefined ? address : organization.address;

        await organization.save();
        res.json(organization);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete organization
// @route   DELETE /api/organizations/:id
// @access  Private
exports.deleteOrganization = async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if user is owner
        if (organization.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this organization' });
        }

        await organization.deleteOne();
        res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
