require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Admin = require('../src/models/Admin');

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
      process.exit(1);
    }

    await connectDB();

    let admin = await Admin.findOne({ email: String(email).toLowerCase() });
    if (admin) {
      // Update password if provided, otherwise keep existing
      const hashed = await bcrypt.hash(password, 10);
      admin.password = hashed;
      await admin.save();
      console.log('Existing admin updated:', email);
    } else {
      const hashed = await bcrypt.hash(password, 10);
      admin = await Admin.create({ email: String(email).toLowerCase(), password: hashed });
      console.log('Admin user created:', email);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding admin failed:', err.message);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
})();