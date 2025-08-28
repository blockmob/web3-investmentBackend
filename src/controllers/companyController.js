const Company = require('../models/Company');

exports.create = async (req, res) => {
  try {
    const { companyName, registrationNumber, email, phone, website, industry, address, city, country } = req.body;
    if (!companyName || !email || !phone || !industry || !address || !city || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const company = await Company.create({
      companyName,
      registrationNumber: registrationNumber || undefined,
      email: String(email).toLowerCase(),
      phone,
      website: website || null,
      industry,
      address,
      city,
      country,
      // attach owner if available (user-created)
      owner: req.user ? req.user._id : undefined,
      approved: false,
      approvalStatus: 'pending',
      denialReason: null,
    });

    return res.status(201).json(company);
  } catch (err) {
    console.error('Create company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAll = async (_req, res) => {
  try {
    const companies = await Company.find({}).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (err) {
    console.error('Get all companies error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPending = async (_req, res) => {
  try {
    const companies = await Company.find({ approvalStatus: 'pending' }).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (err) {
    console.error('Get pending companies error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getApproved = async (_req, res) => {
  try {
    const companies = await Company.find({ approvalStatus: 'approved' }).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (err) {
    console.error('Get approved companies error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDenied = async (_req, res) => {
  try {
    const companies = await Company.find({ approvalStatus: 'denied' }).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (err) {
    console.error('Get denied companies error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByIdAndUpdate(
      id,
      { approved: true, approvalStatus: 'approved', denialReason: null },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: 'Company not found' });
    return res.json(company);
  } catch (err) {
    console.error('Approve company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deny = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Denial message is required' });

    const company = await Company.findByIdAndUpdate(
      id,
      { approved: false, approvalStatus: 'denied', denialReason: message },
      { new: true }
    );

    if (!company) return res.status(404).json({ message: 'Company not found' });
    return res.json(company);
  } catch (err) {
    console.error('Deny company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id).populate('campaigns');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    return res.json(company);
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid company id' });
    }
    console.error('Get company by id error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// User-scoped: get a company by id only if owned by the requester
exports.getByIdForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (!company.owner || String(company.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not your company' });
    }
    return res.json(company);
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid company id' });
    }
    console.error('Get company by id (user) error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// User-scoped: update company KYC status based on frontend provider output
exports.updateKycStatusForUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, denialReason } = req.body || {};

    if (!['pending', 'approved', 'denied'].includes(status || '')) {
      return res.status(400).json({ message: "status must be one of 'pending', 'approved', 'denied'" });
    }

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (!company.owner || String(company.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not your company' });
    }

    company.approvalStatus = status;
    company.approved = status === 'approved';
    company.denialReason = status === 'denied' ? (denialReason || 'KYC denied') : null;
    await company.save();

    return res.json({
      message: 'KYC status updated',
      company,
    });
  } catch (err) {
    console.error('Update company KYC (user) error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getMineForUser = async (req, res) => {
  try {
    const { approvalStatus } = req.query || {};
    const filter = { owner: req.user._id };

    if (approvalStatus && ['pending', 'approved', 'denied'].includes(approvalStatus)) {
      filter.approvalStatus = approvalStatus;
    }

    const companies = await Company.find(filter).sort({ createdAt: -1 });
    return res.json(companies);
  } catch (err) {
    console.error('Get my companies error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};