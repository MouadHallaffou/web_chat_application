"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Validate email configuration
const validateEmailConfig = () => {
    const requiredEnvVars = [
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS',
        'EMAIL_FROM'
    ];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        console.warn('Missing email configuration:', missingVars);
        return false;
    }
    return true;
};
const transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendEmail = async (options) => {
    if (!validateEmailConfig()) {
        console.warn('Email configuration is incomplete. Skipping email send.');
        return;
    }
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', options.email);
    }
    catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
