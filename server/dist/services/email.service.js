"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const error_handler_1 = require("../middlewares/error-handler");
class EmailService {
    constructor() {
        this.retryCount = 3;
        this.retryDelay = 1000; // 1 second
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email configuration missing:', {
                hasUser: !!process.env.EMAIL_USER,
                hasPass: !!process.env.EMAIL_PASS
            });
            throw new Error('Email credentials are not configured. Please check your .env file.');
        }
        this.transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async verifyConnection() {
        try {
            console.log('Verifying email connection with credentials:', {
                user: process.env.EMAIL_USER,
                hasPass: !!process.env.EMAIL_PASS
            });
            await this.transporter.verify();
            console.log('Email connection verified successfully');
            return true;
        }
        catch (error) {
            console.error('Email connection verification failed:', error);
            return false;
        }
    }
    async retryOperation(operation, retries = this.retryCount) {
        try {
            return await operation();
        }
        catch (error) {
            if (retries > 0) {
                console.log(`Retrying operation. Attempts left: ${retries}`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.retryOperation(operation, retries - 1);
            }
            throw error;
        }
    }
    async sendEmail(options) {
        try {
            // Verify connection before sending
            const isConnected = await this.verifyConnection();
            if (!isConnected) {
                throw new error_handler_1.AppError(500, 'Email service is not available');
            }
            const mailOptions = {
                from: `"Chat App" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html
            };
            await this.retryOperation(async () => {
                const info = await this.transporter.sendMail(mailOptions);
                console.log('Email sent successfully:', info.messageId);
            });
        }
        catch (error) {
            console.error('Failed to send email:', error);
            throw new error_handler_1.AppError(500, 'Failed to send email. Please try again later.');
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
      </div>
    `;
        await this.sendEmail({
            to: email,
            subject: 'Verify Your Email',
            html
        });
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
exports.emailService = EmailService.getInstance();
