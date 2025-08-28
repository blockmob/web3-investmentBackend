const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateVerificationCode, sendVerificationEmail } = require('../utils/emailService');

function signUserToken(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    phoneNumber: user.phoneNumber,
    typ: 'user',
  };
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email: String(email).toLowerCase() }, { phoneNumber }] });
    if (existing) {
      return res.status(409).json({ message: 'Email or phone number already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: String(email).toLowerCase().trim(),
      phoneNumber: String(phoneNumber).trim(),
      password: hashed,
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpires: verificationExpires,
    });

    // Send verification email (non-blocking awaited here to surface errors to client)
    await sendVerificationEmail(user.email, user.firstName, verificationCode);

    const token = signUserToken(user);
    return res.status(201).json({
      message: 'Registration successful. Verification code sent to email.',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error('User register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({ message: 'No verification code found. Please request a new code.' });
    }

    if (new Date() > user.emailVerificationExpires) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new code.' });
    }

    if (String(code).trim() !== user.emailVerificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    const verificationCode = generateVerificationCode();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.firstName, verificationCode);

    return res.json({ message: 'Verification code resent to email' });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const isEmail = String(identifier).includes('@');
    const query = isEmail
      ? { email: String(identifier).toLowerCase() }
      : { phoneNumber: String(identifier) };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    const token = signUserToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error('User login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};