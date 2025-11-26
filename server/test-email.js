require('dotenv').config();
const { sendEmail, emailTemplates } = require('./config/emailService');

async function testEmail() {
    console.log('🧪 Testing Email Configuration...\n');
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.error('❌ Email credentials not configured!');
        console.error('Please set EMAIL_USER and EMAIL_APP_PASSWORD in .env file');
        process.exit(1);
    }

    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔑 App Password:', process.env.EMAIL_APP_PASSWORD ? '✓ Configured' : '✗ Missing');
    console.log('\n📤 Sending test email to: kingscreationagency635@gmail.com\n');

    try {
        // Test 1: Payment Success Email
        console.log('Test 1: Payment Success Email...');
        const paymentTemplate = emailTemplates.paymentSuccess('Test User', 500, 50);
        const result1 = await sendEmail({
            to: 'kingscreationagency635@gmail.com',
            ...paymentTemplate
        });

        if (result1.success) {
            console.log('✅ Payment email sent successfully!');
            console.log('   Message ID:', result1.messageId);
        } else {
            console.error('❌ Payment email failed:', result1.error);
        }

        // Wait a bit between emails
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: Custom Marketing Email
        console.log('\nTest 2: Marketing Email...');
        const result2 = await sendEmail({
            to: 'kingscreationagency635@gmail.com',
            subject: 'Welcome to PollSync - Test Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 PollSync Email Test</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Email System is Working!</h2>
                        <p style="color: #4b5563; line-height: 1.6;">
                            This is a test email from your PollSync application. If you're reading this, 
                            your email configuration is working correctly! 🎊
                        </p>
                        <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #4338ca; font-weight: bold;">✓ Gmail Integration Active</p>
                            <p style="margin: 5px 0 0 0; color: #6366f1; font-size: 14px;">✓ Nodemailer Configured</p>
                            <p style="margin: 5px 0 0 0; color: #6366f1; font-size: 14px;">✓ Email Templates Ready</p>
                        </div>
                        <p style="color: #4b5563;">
                            You can now:
                        </p>
                        <ul style="color: #4b5563; line-height: 1.8;">
                            <li>Send payment confirmations automatically</li>
                            <li>Send bulk marketing emails to users</li>
                            <li>Customize email templates as needed</li>
                        </ul>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            This is a test email from PollSync<br>
                            <a href="https://kingscreation.co.ke" style="color: #667eea; text-decoration: none;">kingscreation.co.ke</a>
                        </p>
                    </div>
                </div>
            `,
            text: 'PollSync Email Test - Your email system is working correctly!'
        });

        if (result2.success) {
            console.log('✅ Marketing email sent successfully!');
            console.log('   Message ID:', result2.messageId);
        } else {
            console.error('❌ Marketing email failed:', result2.error);
        }

        console.log('\n✅ Email test complete!');
        console.log('📬 Check kingscreationagency635@gmail.com inbox (and spam folder)');
        console.log('\n💡 If emails are in spam, mark them as "Not Spam" to improve deliverability');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Email test failed:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Verify EMAIL_USER is correct in .env');
        console.error('2. Verify EMAIL_APP_PASSWORD is a Gmail App Password (not regular password)');
        console.error('3. Ensure 2-Step Verification is enabled on Gmail');
        console.error('4. Generate new App Password at: https://myaccount.google.com/apppasswords');
        process.exit(1);
    }
}

// Run the test
testEmail();
