const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { requireUserAuth } = require('../utils/authMiddleware');

// All routes protected by user auth
router.use(requireUserAuth);

// User company creation endpoint
router.post('/', companyController.create);

module.exports = router;