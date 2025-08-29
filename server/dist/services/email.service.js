"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5
        });
    }
    async retryOperation(operation) {
        let lastError = null;
        for (let i = 0; i < this.maxRetries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                console.warn(`Email operation failed (attempt ${i + 1}/${this.maxRetries}):`, error);
                if (i < this.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
                }
            }
        }
        throw lastError;
    }
    async verifyConnection() {
        try {
            console.log('Verifying email connection with credentials:', {
                user: process.env.EMAIL_USER,
                hasPass: !!process.env.EMAIL_PASS
            });
            await this.retryOperation(() => this.transporter.verify());
            console.log('Email connection verified successfully');
            return true;
        }
        catch (error) {
            console.error('Email connection verification failed:', error);
            return false;
        }
    }
    async sendVerificationEmail(email, token) {
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Our Platform!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
        <p style="margin-top: 20px; color: #666;">
          If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          This verification link will expire in 24 hours.
        </p>
      </div>
    `;
        await this.retryOperation(() => this.sendEmail({
            to: email,
            subject: 'Verify Your Email',
            html
        }));
    }
    async sendEmail(options) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        await this.retryOperation(() => this.transporter.sendMail(mailOptions));
    }
    async sendResetPasswordEmail(email, resetUrl) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>Please click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
        <p style="margin-top: 20px; color: #666;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Reset Your Password',
            html
        });
    }
}
exports.emailService = new EmailService();
