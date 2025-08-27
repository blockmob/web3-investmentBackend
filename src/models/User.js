const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String,  trim: true },
    lastName: { type: String,  trim: true },
    email: { type: String,  unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String,  unique: true, trim: true },
    password: { type: String  },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);