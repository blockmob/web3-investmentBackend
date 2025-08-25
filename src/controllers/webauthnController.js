const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const Admin = require('../models/Admin');

const rpID = process.env.WEBAUTHN_RP_ID;
const rpName = process.env.WEBAUTHN_RP_NAME || 'InvestHub Admin';
const expectedOrigin = process.env.WEBAUTHN_ORIGIN;

function ensureWebAuthnEnv() {
  if (!rpID) throw new Error('WEBAUTHN_RP_ID not set');
  if (!expectedOrigin) throw new Error('WEBAUTHN_ORIGIN not set');
}

function signToken(admin) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign({ sub: admin._id.toString(), email: admin.email }, secret, { expiresIn: '1d' });
}

function bufferToBase64URL(b) {
  return Buffer.from(b)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

exports.generateRegistrationOptions = async (req, res) => {
  try {
    ensureWebAuthnEnv();
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const userId = (admin.webAuthn && admin.webAuthn.userId) || admin._id.toString();
    admin.webAuthn = admin.webAuthn || { credentials: [] };
    admin.webAuthn.userId = userId;

    const excludeCredentials = (admin.webAuthn.credentials || []).map((c) => ({
      id: c.credentialID,
      type: 'public-key',
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: admin.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
        // authenticatorAttachment omitted to allow both platform and cross-platform
      },
      timeout: 60_000,
      excludeCredentials,
    });

    admin.webAuthn.currentChallenge = options.challenge;
    await admin.save();

    return res.json(options);
  } catch (err) {
    console.error('generateRegistrationOptions error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyRegistration = async (req, res) => {
  try {
    ensureWebAuthnEnv();
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const body = req.body;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: admin.webAuthn?.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

      const exists = (admin.webAuthn.credentials || []).some(
        (c) => bufferToBase64URL(c.credentialID) === bufferToBase64URL(credentialID)
      );
      if (!exists) {
        admin.webAuthn.credentials.push({
          credentialID,
          credentialPublicKey,
          counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: [],
        });
      }

      admin.webAuthn.currentChallenge = undefined;
      await admin.save();
    }

    return res.json({ verified });
  } catch (err) {
    console.error('verifyRegistration error:', err);
    return res.status(400).json({ message: 'Registration verification failed' });
  }
};

exports.generateAuthenticationOptions = async (req, res) => {
  try {
    ensureWebAuthnEnv();
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const admin = await Admin.findOne({ email: String(email).toLowerCase() });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const credentials = admin.webAuthn?.credentials || [];
    if (!credentials.length) return res.status(400).json({ message: 'No passkeys registered for this admin' });

    const allowCredentials = credentials.map((c) => ({
      id: c.credentialID,
      type: 'public-key',
      transports: c.transports && c.transports.length ? c.transports : undefined,
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      timeout: 60_000,
      userVerification: 'required',
      allowCredentials,
    });

    admin.webAuthn.currentChallenge = options.challenge;
    await admin.save();

    return res.json(options);
  } catch (err) {
    console.error('generateAuthenticationOptions error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyAuthentication = async (req, res) => {
  try {
    ensureWebAuthnEnv();
    const { email, response } = req.body || {};
    if (!email || !response) return res.status(400).json({ message: 'Email and response are required' });

    const admin = await Admin.findOne({ email: String(email).toLowerCase() });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const creds = admin.webAuthn?.credentials || [];
    const cred = creds.find((c) => bufferToBase64URL(c.credentialID) === response.id);
    if (!cred) return res.status(400).json({ message: 'Unknown credential for this admin' });

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: admin.webAuthn?.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      authenticator: {
        credentialID: cred.credentialID,
        credentialPublicKey: cred.credentialPublicKey,
        counter: cred.counter,
        transports: cred.transports,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified) return res.status(400).json({ verified: false, message: 'Authentication failed' });

    cred.counter = authenticationInfo.newCounter;
    admin.webAuthn.currentChallenge = undefined;
    await admin.save();

    const token = signToken(admin);
    return res.json({ verified: true, token, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    console.error('verifyAuthentication error:', err);
    return res.status(400).json({ message: 'Authentication verification failed' });
  }
};