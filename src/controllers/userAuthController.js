const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: String(email).toLowerCase().trim(),
      phoneNumber: String(phoneNumber).trim(),
      password: hashed,
    });

    const token = signUserToken(user);
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.error('User register error:', err);
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

    const token = signUserToken(user);
    return res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (err) {
    console.error('User login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};