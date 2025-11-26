const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"PollSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  electionCreated: (userName, electionTitle, electionId) => ({
    subject: 'Election Created Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Election Created!</h2>
        <p>Hi ${userName},</p>
        <p>Your election "<strong>${electionTitle}</strong>" has been created successfully.</p>
        <p>Election ID: ${electionId}</p>
        <p>You can manage your election from your dashboard.</p>
        <p>Best regards,<br>The PollSync Team</p>
      </div>
    `,
    text: `Election Created! Your election "${electionTitle}" has been created successfully.`
  }),

  paymentSuccess: (userName, amount, credits) => ({
    subject: 'Payment Successful - Credits Added',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Payment Successful!</h2>
        <p>Hi ${userName},</p>
        <p>Your payment of <strong>KES ${amount}</strong> has been processed successfully.</p>
        <p><strong>${credits} vote credits</strong> have been added to your account.</p>
        <p>You can now use these credits to create elections.</p>
        <p>Best regards,<br>The PollSync Team</p>
      </div>
    `,
    text: `Payment Successful! Your payment of KES ${amount} has been processed. ${credits} credits added.`
  }),

  passwordReset: (userName, resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Password Reset</h2>
        <p>Hi ${userName},</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The PollSync Team</p>
      </div>
    `,
    text: `Password Reset: Click this link to reset your password: ${resetLink}`
  })
};

module.exports = { sendEmail, emailTemplates };
