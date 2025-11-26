/**
 * Email Service Usage Examples
 * 
 * This file shows how to use the email service in different parts of your application.
 * Copy these examples into your controllers as needed.
 */

const { sendEmail, emailTemplates } = require('../config/emailService');

// Example 1: Send welcome email on user registration
async function sendWelcomeEmail(user) {
    const template = emailTemplates.welcome(user.username);
    await sendEmail({
        to: user.email,
        ...template
    });
}

// Example 2: Send election created notification
async function sendElectionCreatedEmail(user, election) {
    const template = emailTemplates.electionCreated(
        user.username,
        election.title,
        election._id
    );
    await sendEmail({
        to: user.email,
        ...template
    });
}

// Example 3: Send payment success notification
async function sendPaymentSuccessEmail(user, amount, credits) {
    const template = emailTemplates.paymentSuccess(
        user.username,
        amount,
        credits
    );
    await sendEmail({
        to: user.email,
        ...template
    });
}

// Example 4: Send password reset email
async function sendPasswordResetEmail(user, resetToken) {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const template = emailTemplates.passwordReset(user.username, resetLink);
    await sendEmail({
        to: user.email,
        ...template
    });
}

// Example 6: Send custom email
async function sendCustomEmail(to, subject, htmlContent) {
    await sendEmail({
        to,
        subject,
        html: htmlContent,
        text: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    });
}

module.exports = {
    sendElectionCreatedEmail,
    sendPaymentSuccessEmail,
    sendPasswordResetEmail,
    sendCustomEmail
};
