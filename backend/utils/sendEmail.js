const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create reusable transporter object using Mailtrap SMTP credentials
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 2525,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      // Do not fail on invalid certs (helpful for local sandbox testing environments)
      rejectUnauthorized: false
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // Send the actual email payload
  await transporter.sendMail(message);
};

module.exports = sendEmail;