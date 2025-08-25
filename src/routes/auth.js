const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const webauthn = require('../controllers/webauthnController');
const { requireAuth } = require('../utils/authMiddleware');

router.post('/login', login);

// WebAuthn (Passkeys)
router.post('/webauthn/register/options', requireAuth, webauthn.generateRegistrationOptions);
router.post('/webauthn/register/verify', requireAuth, webauthn.verifyRegistration);
router.post('/webauthn/authenticate/options', webauthn.generateAuthenticationOptions);
router.post('/webauthn/authenticate/verify', webauthn.verifyAuthentication);

module.exports = router;