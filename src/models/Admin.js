const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    // WebAuthn / Passkeys storage
    webAuthn: {
      userId: { type: String }, // Stable user handle for WebAuthn (e.g., admin _id as string)
      currentChallenge: { type: String },
      credentials: [
        new mongoose.Schema(
          {
            credentialID: { type: Buffer, required: true },
            credentialPublicKey: { type: Buffer, required: true },
            counter: { type: Number, required: true, default: 0 },
            transports: { type: [String], default: [] },
            deviceType: { type: String }, // platform or cross-platform, if available
            backedUp: { type: Boolean },
          },
          { _id: false }
        ),
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);