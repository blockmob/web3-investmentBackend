const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const campaignController = require('../controllers/campaignController');
const { requireUserAuth } = require('../utils/authMiddleware');

// All routes protected by user auth
router.use(requireUserAuth);

// List my companies
router.get('/', companyController.getMineForUser);

// User company creation endpoint
router.post('/', companyController.create);

// Get own company by id
router.get('/:id', companyController.getByIdForUser);

// Update company KYC status (from frontend KYC provider result)
router.patch('/:id/kyc', companyController.updateKycStatusForUser);

// Create a campaign under a company (user)
router.post('/:companyId/campaigns', campaignController.createByUser);

module.exports = router;