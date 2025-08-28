const Campaign = require('../models/Campaign');
const Company = require('../models/Company');

exports.create = async (req, res) => {
  try {
    const {
      companyId,
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
    } = req.body;

    if (!companyId) return res.status(400).json({ message: 'companyId is required' });
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    const required = [
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
    ];
    if (required.some((v) => v === undefined || v === null || v === '')) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const campaign = await Campaign.create({
      company: company._id,
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
      approvalStatus: 'pending',
    });

    return res.status(201).json(campaign);
  } catch (err) {
    console.error('Create campaign error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createByUser = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
    } = req.body || {};

    if (!companyId) return res.status(400).json({ message: 'companyId is required' });
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Ownership check
    if (!company.owner || String(company.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not your company' });
    }

    // Company KYC must be approved
    if (company.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Company KYC not approved. You cannot create campaigns yet.' });
    }

    const required = [
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
    ];
    if (required.some((v) => v === undefined || v === null || v === '')) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const campaign = await Campaign.create({
      company: company._id,
      _companyName,
      _description,
      _duration,
      _hardCap,
      _interestRate,
      _maxInvestment,
      _minInvestment,
      _payoutFrequency,
      _softCap,
      campaignEndTime,
      campaignStartTime,
      maturityDate,
      approvalStatus: 'pending',
    });

    // Try to create a notification if model exists
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: req.user._id,
        type: 'campaign_submitted',
        title: 'Campaign Submitted',
        message: `Your campaign for ${_companyName} has been submitted for review.`,
        data: { campaignId: campaign._id.toString(), companyId: company._id.toString() },
      });
    } catch (e) {
      // Notification model might not exist yet; ignore to avoid breaking request
    }

    return res.status(201).json(campaign);
  } catch (err) {
    console.error('Create campaign by user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;
    const campaigns = await Campaign.find({ company: companyId }).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    console.error('Get campaigns by company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getPendingByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const campaigns = await Campaign.find({ company: companyId, approvalStatus: 'pending' }).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    console.error('Get pending campaigns by company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getApprovedByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const campaigns = await Campaign.find({ company: companyId, approvalStatus: 'approved' }).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    console.error('Get approved campaigns by company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getDeniedByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const campaigns = await Campaign.find({ company: companyId, approvalStatus: 'denied' }).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    console.error('Get denied campaigns by company error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getAll = async (_req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    return res.json(campaigns);
  } catch (err) {
    console.error('Get all campaigns error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { approvalStatus: 'approved', denialReason: null },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Notify campaign owner (via company.owner)
    try {
      const Notification = require('../models/Notification');
      const company = await Company.findById(campaign.company);
      if (company && company.owner) {
        await Notification.create({
          user: company.owner,
          type: 'campaign_approved',
          title: 'Campaign Approved',
          message: `Your campaign for ${campaign._companyName} has been approved.`,
          data: { campaignId: campaign._id.toString(), companyId: campaign.company.toString() },
        });
      }
    } catch (e) {}

    return res.json(campaign);
  } catch (err) {
    console.error('Approve campaign error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deny = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Denial message is required' });

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { approvalStatus: 'denied', denialReason: message },
      { new: true }
    );

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    // Notify campaign owner of denial
    try {
      const Notification = require('../models/Notification');
      const company = await Company.findById(campaign.company);
      if (company && company.owner) {
        await Notification.create({
          user: company.owner,
          type: 'campaign_denied',
          title: 'Campaign Denied',
          message: message,
          data: { campaignId: campaign._id.toString(), companyId: campaign.company.toString() },
        });
      }
    } catch (e) {}

    return res.json(campaign);
  } catch (err) {
    console.error('Deny campaign error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    return res.json(campaign);
  } catch (err) {
    if (err && err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid campaign id' });
    }
    console.error('Get campaign by id error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};