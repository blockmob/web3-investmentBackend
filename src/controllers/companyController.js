const Company = require('../models/Company');

exports.create = async (req, res) => {
  try {
    const { companyName, registrationNumber, email, phone, website, industry, address, city, country } = req.body;
    if (!companyName || !registrationNumber || !email || !phone || !industry || !address || !city || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const company = await Company.create({
      companyName,
      registrationNumber,
      email: String(email).toLowerCase(),
      phone,
      website: website || null,
      industry,
      address,
      city,
      country,
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
    const company = await Company.findById(id);
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