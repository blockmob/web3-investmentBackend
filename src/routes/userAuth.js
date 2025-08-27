const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');

// Public user auth routes
router.post('/register', userAuthController.register);
router.post('/login', userAuthController.login);

module.exports = router;