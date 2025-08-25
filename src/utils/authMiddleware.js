const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authorization token missing' });

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');

    const decoded = jwt.verify(token, secret);
    const admin = await Admin.findById(decoded.sub).select('-password');
    if (!admin) return res.status(401).json({ message: 'Invalid token' });

    req.admin = admin;
    return next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};