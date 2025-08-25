const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    // options kept minimal; Mongoose 6+ uses sensible defaults
  });

  console.log('MongoDB connected');
}

module.exports = { connectDB };