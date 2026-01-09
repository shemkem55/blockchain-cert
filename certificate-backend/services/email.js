const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASSWORD || "your-app-password",
    },
});

transporter.verify((error, success) => {
    if (error) {
        console.warn("⚠️  Email configuration issue (OTP will log to console):", error.message);
    } else {
        console.log("✅ Email service ready - OTP will be sent via email");
    }
});

async function sendOTPEmail(email, otp) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || "your-email@gmail.com",
            to: email,
            subject: "🔐 Your OTP Verification Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">Email Verification</h2>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hello,</p>
            <p style="color: #555; font-size: 14px;">Your OTP verification code is:</p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px;">⏱️ This code expires in 10 minutes</p>
            <p style="color: #555; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">Blockchain Certificate System</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
        console.log("\n" + "=".repeat(60));
        console.log(`📧 OTP FALLBACK FOR: ${email}`);
        console.log(`🔐 OTP CODE: ${otp}`);
        console.log(`⏱️  EXPIRES IN: 10 minutes`);
        console.log("=".repeat(60) + "\n");
        return false;
    }
}

module.exports = { sendOTPEmail };
