const nodemailer = require('nodemailer');

// Configure transporter based on environment variables
function createTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
    throw new Error('Email configuration missing. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM environment variables.');
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT, 10),
    secure: String(EMAIL_PORT) === '465', // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

// Generate 6-digit verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email
async function sendVerificationEmail(email, firstName, code) {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Email Verification - InvestHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Hello ${firstName || 'there'},</p>
        <p>Thank you for registering with InvestHub. Please use the verification code below to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
        </div>
        <p>This verification code will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>InvestHub Team</p>
      </div>
    `,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log('Verification email sent:', result.messageId);
  return true;
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
};