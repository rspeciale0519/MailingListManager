/**
 * Email service for sending transactional emails
 * Uses nodemailer with configurable SMTP settings
 */
import nodemailer from 'nodemailer';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@mailinglistmanager.com';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Mailing List Manager';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
let transporter = null;
/**
 * Initialize email transporter
 * Creates a reusable SMTP transport configuration
 */
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465, // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }
    return transporter;
}
/**
 * Send a verification email to a user
 * @param email - User's email address
 * @param verificationToken - JWT verification token
 * @returns Promise that resolves when email is sent
 */
export async function sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
    const mailOptions = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Welcome to Mailing List Manager!</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for signing up. Please verify your email address to activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #888; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
        text: `
Welcome to Mailing List Manager!

Thank you for signing up. Please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    `.trim(),
    };
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
}
/**
 * Send a password reset email
 * @param email - User's email address
 * @param resetToken - Password reset token
 * @returns Promise that resolves when email is sent
 */
export async function sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: email,
        subject: 'Reset Your Password',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #dc2626; margin-top: 0;">Password Reset Request</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #888; word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
        text: `
Password Reset Request

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    `.trim(),
    };
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
}
/**
 * Send a welcome email after successful verification
 * @param email - User's email address
 * @param firstName - User's first name
 * @returns Promise that resolves when email is sent
 */
export async function sendWelcomeEmail(email, firstName) {
    const mailOptions = {
        from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
        to: email,
        subject: 'Welcome to Mailing List Manager!',
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #16a34a; margin-top: 0;">Welcome, ${firstName}!</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Your email has been verified successfully. You're all set to start managing your mailing lists!
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}/dashboard"
                 style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Need help getting started? Check out our documentation or contact support.
            </p>
          </div>
        </body>
      </html>
    `,
        text: `
Welcome, ${firstName}!

Your email has been verified successfully. You're all set to start managing your mailing lists!

Visit your dashboard: ${APP_URL}/dashboard

Need help getting started? Check out our documentation or contact support.
    `.trim(),
    };
    const transport = getTransporter();
    await transport.sendMail(mailOptions);
}
