const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { requireAuth } = require('../utils/authMiddleware');

// All routes protected by admin auth
router.use(requireAuth);

// Get all campaigns
router.get('/', campaignController.getAll);

router.post('/', campaignController.create);
router.get('/company/:companyId', campaignController.getByCompanyId);
router.get('/company/:companyId/pending', campaignController.getPendingByCompany);
router.get('/company/:companyId/approved', campaignController.getApprovedByCompany);
router.get('/company/:companyId/denied', campaignController.getDeniedByCompany);

// Get single campaign by id (after company-specific routes)
router.get('/:id', campaignController.getById);

router.post('/:id/approve', campaignController.approve);
router.post('/:id/deny', campaignController.deny);

module.exports = router;