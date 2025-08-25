const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { requireAuth } = require('../utils/authMiddleware');

// All routes protected by admin auth
router.use(requireAuth);

router.post('/', companyController.create);
router.get('/', companyController.getAll);
router.get('/pending', companyController.getPending);
router.get('/approved', companyController.getApproved);
router.get('/denied', companyController.getDenied);
router.get('/:id', companyController.getById);
router.post('/:id/approve', companyController.approve);
router.post('/:id/deny', companyController.deny);

module.exports = router;