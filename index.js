require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./src/config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/userAuth'));
app.use('/api/companies', require('./src/routes/company'));
app.use('/api/user/companies', require('./src/routes/userCompany'));
app.use('/api/user/notifications', require('./src/routes/userNotification'));
app.use('/api/campaigns', require('./src/routes/campaign'));

// Start server only after DB connects
const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server due to DB connection error:', err.message);
    process.exit(1);
  });