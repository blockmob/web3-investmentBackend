require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Company = require('../src/models/Company');
const Campaign = require('../src/models/Campaign');

function daysFrom(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

(async () => {
  try {
    await connectDB();

    // Define companies to seed (approved and pending)
    const companies = [
      {
        companyName: 'Acme Industries',
        contactName: 'Alice Johnson',
        email: 'alice@acme.com',
        phone: '+1-555-0101',
        website: 'https://acme.example',
        description: 'Advanced manufacturing and robotics.',
        approved: true,
        approvalStatus: 'approved',
        denialReason: null,
      },
      {
        companyName: 'Beta Fintech',
        contactName: 'Bob Lee',
        email: 'bob@betafintech.io',
        phone: '+1-555-0202',
        website: 'https://beta.example',
        description: 'Fintech solutions for SMEs.',
        approved: false,
        approvalStatus: 'pending',
        denialReason: null,
      },
      {
        companyName: 'Cobalt Energy',
        contactName: 'Carol Smith',
        email: 'carol@cobalt.energy',
        phone: '+1-555-0303',
        website: 'https://cobalt.example',
        description: 'Clean energy infrastructure projects.',
        approved: true,
        approvalStatus: 'approved',
        denialReason: null,
      },
      {
        companyName: 'Delta Health',
        contactName: 'Dan Wu',
        email: 'dan@deltahealth.ai',
        phone: '+1-555-0404',
        website: 'https://delta.example',
        description: 'AI diagnostics for healthcare providers.',
        approved: false,
        approvalStatus: 'pending',
        denialReason: null,
      },
    ];

    // Make seeding idempotent by removing existing entries with same companyName
    const names = companies.map((c) => c.companyName);
    await Company.deleteMany({ companyName: { $in: names } });

    // Insert companies
    const insertedCompanies = await Company.insertMany(companies);
    console.log(`Seeded ${insertedCompanies.length} companies`);

    // Build campaigns associated with companies
    const now = new Date();

    const companyByName = Object.fromEntries(
      insertedCompanies.map((c) => [c.companyName, c])
    );

    const campaigns = [
      // For Acme (approved): add one approved and one pending campaign
      {
        company: companyByName['Acme Industries']._id,
        _companyName: 'Acme Industries',
        _description: 'Robotics Series A',
        _duration: 180,
        _hardCap: 1000000,
        _interestRate: 10.5,
        _maxInvestment: 25000,
        _minInvestment: 250,
        _payoutFrequency: 'monthly',
        _softCap: 400000,
        campaignStartTime: daysFrom(now, -7),
        campaignEndTime: daysFrom(now, 60),
        maturityDate: daysFrom(now, 365),
        approvalStatus: 'approved',
        denialReason: null,
      },
      {
        company: companyByName['Acme Industries']._id,
        _companyName: 'Acme Industries',
        _description: 'Automation Expansion',
        _duration: 120,
        _hardCap: 750000,
        _interestRate: 9.25,
        _maxInvestment: 20000,
        _minInvestment: 200,
        _payoutFrequency: 'quarterly',
        _softCap: 300000,
        campaignStartTime: daysFrom(now, 1),
        campaignEndTime: daysFrom(now, 90),
        maturityDate: daysFrom(now, 365 + 90),
        approvalStatus: 'pending',
        denialReason: null,
      },

      // For Beta (pending company): campaigns pending
      {
        company: companyByName['Beta Fintech']._id,
        _companyName: 'Beta Fintech',
        _description: 'SME Lending Pilot',
        _duration: 90,
        _hardCap: 300000,
        _interestRate: 12.0,
        _maxInvestment: 10000,
        _minInvestment: 100,
        _payoutFrequency: 'monthly',
        _softCap: 100000,
        campaignStartTime: daysFrom(now, 3),
        campaignEndTime: daysFrom(now, 60),
        maturityDate: daysFrom(now, 365),
        approvalStatus: 'pending',
        denialReason: null,
      },

      // For Cobalt (approved): one approved
      {
        company: companyByName['Cobalt Energy']._id,
        _companyName: 'Cobalt Energy',
        _description: 'Solar Farm Buildout',
        _duration: 240,
        _hardCap: 2000000,
        _interestRate: 8.75,
        _maxInvestment: 50000,
        _minInvestment: 500,
        _payoutFrequency: 'semi-annual',
        _softCap: 800000,
        campaignStartTime: daysFrom(now, -14),
        campaignEndTime: daysFrom(now, 120),
        maturityDate: daysFrom(now, 730),
        approvalStatus: 'approved',
        denialReason: null,
      },

      // For Delta (pending company): one pending
      {
        company: companyByName['Delta Health']._id,
        _companyName: 'Delta Health',
        _description: 'Diagnostics Platform Beta',
        _duration: 150,
        _hardCap: 600000,
        _interestRate: 11.0,
        _maxInvestment: 15000,
        _minInvestment: 150,
        _payoutFrequency: 'monthly',
        _softCap: 250000,
        campaignStartTime: daysFrom(now, 5),
        campaignEndTime: daysFrom(now, 100),
        maturityDate: daysFrom(now, 365 + 150),
        approvalStatus: 'pending',
        denialReason: null,
      },
    ];

    // Make seeding idempotent: remove matching campaigns for these companies
    const companyIds = insertedCompanies.map((c) => c._id);
    await Campaign.deleteMany({ company: { $in: companyIds } });

    const insertedCampaigns = await Campaign.insertMany(campaigns);
    console.log(`Seeded ${insertedCampaigns.length} campaigns`);

    await mongoose.disconnect();
    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding data failed:', err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();