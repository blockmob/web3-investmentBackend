const mongoose = require('mongoose');
const { Schema } = mongoose;

const campaignSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    _companyName: { type: String, required: true, trim: true },
    _description: { type: String, required: true, trim: true },
    _duration: { type: Number, required: true },
    _hardCap: { type: Number, required: true },
    _interestRate: { type: Number, required: true },
    _maxInvestment: { type: Number, required: true },
    _minInvestment: { type: Number, required: true },
    _payoutFrequency: { type: String, required: true, trim: true },
    _softCap: { type: Number, required: true },

    campaignEndTime: { type: Date, required: true },
    campaignStartTime: { type: Date, required: true },
    maturityDate: { type: Date, required: true },

    approvalStatus: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending', index: true },
    denialReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);