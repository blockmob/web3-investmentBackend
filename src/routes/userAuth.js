const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');

// Public user auth routes
router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);
router.post('/verify-email', userAuthController.verifyEmail);
router.post('/resend-email', userAuthController.resendVerification);

module.exports = router;