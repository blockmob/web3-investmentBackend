const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, default: null, trim: true },
    industry: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    // Approval fields
    approved: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending', index: true },
    denialReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual populate for campaigns belonging to the company
companySchema.virtual('campaigns', {
  ref: 'Campaign',
  localField: '_id',
  foreignField: 'company',
  justOne: false,
  options: { sort: { createdAt: -1 } },
});

// Ensure virtuals are included in JSON and object outputs
companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);