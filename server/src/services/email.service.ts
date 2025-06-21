import nodemailer from 'nodemailer';
import { AppError } from '../middlewares/error-handler';

class EmailService {
  private transporter: any;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.transporter = nodemailer.createTransport({
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

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Email operation failed (attempt ${i + 1}/${this.maxRetries}):`, error);
        if (i < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, i)));
        }
      }
    }
    
    throw lastError;
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      console.log('Verifying email connection with credentials:', {
        user: process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS
      });

      await this.retryOperation(() => this.transporter.verify());
      console.log('Email connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  public async sendVerificationEmail(email: string, token: string): Promise<void> {
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

  private async sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await this.retryOperation(() => this.transporter.sendMail(mailOptions));
  }

  public async sendResetPasswordEmail(email: string, resetUrl: string): Promise<void> {
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

export const emailService = new EmailService(); 