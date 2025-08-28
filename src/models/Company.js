const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, default: null, trim: true },
    industry: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },

    // Approval fields
    approved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending', index: true },
    denialReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);