import nodemailer from 'nodemailer';

const normalizeEmailAddress = (value?: string) => (value || '').replace(/[<>]/g, '').trim();
const normalizeAppPassword = (value?: string) => (value || '').replace(/\s+/g, '').trim();

/**
 * Email Utility - Handles sending emails using Nodemailer
 * Supports both Gmail SMTP and generic SMTP configuration
 */

/**
 * Create transporter for sending emails
 * Uses environment variables for configuration
 */
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  
  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: normalizeEmailAddress(process.env.GMAIL_EMAIL),
        pass: normalizeAppPassword(process.env.GMAIL_APP_PASSWORD), // Use Google App Password, not regular password
      },
    });
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send verification OTP email
 */
export const sendVerificationOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: normalizeEmailAddress(process.env.EMAIL_FROM) || normalizeEmailAddress(process.env.GMAIL_EMAIL),
      to: email,
      subject: 'JC-Ticket - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <h1 style="color: #DC143C; text-align: center; margin-bottom: 10px;">JC-Ticket</h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">日本イベント管理プラットフォーム</p>

            <h2 style="color: #333; margin-bottom: 20px;">メール認証のご案内</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              こんにちは、${name}さん
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              JC-Ticketへようこそ！ご登録ありがとうございます。
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              以下の確認コード(OTP)を使用してEmail đăng nhậpを認証してください。このコードは10分間有効です。
            </p>

            <div style="background-color: #f9f9f9; border: 2px dashed #DC143C; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <p style="font-size: 12px; color: #999; margin-bottom: 10px;">Verification Code</p>
              <p style="font-size: 36px; font-weight: bold; color: #DC143C; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>

            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">
              ※ 心当たりがない場合は、このメールを無視してください。
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 JC-Ticket. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification OTP:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset OTP email
 */
export const sendPasswordResetOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: normalizeEmailAddress(process.env.EMAIL_FROM) || normalizeEmailAddress(process.env.GMAIL_EMAIL),
      to: email,
      subject: 'JC-Ticket - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <h1 style="color: #DC143C; text-align: center; margin-bottom: 10px;">JC-Ticket</h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">日本イベント管理プラットフォーム</p>

            <h2 style="color: #333; margin-bottom: 20px;">Mật khẩuリセットのご案内</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              こんにちは、${name}さん
            </p>

            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Mật khẩuのリセットをご依頼いただきました。以下の確認コード(OTP)を使用してリセット処理を進めてください。このコードは10分間有効です。
            </p>

            <div style="background-color: #f9f9f9; border: 2px dashed #DC143C; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
              <p style="font-size: 12px; color: #999; margin-bottom: 10px;">Reset Code</p>
              <p style="font-size: 36px; font-weight: bold; color: #DC143C; letter-spacing: 5px; margin: 0;">${otp}</p>
            </div>

            <p style="color: #999; font-size: 12px; margin-bottom: 20px;">
              ※ ご本人以外からのリセット依頼の場合は、このメールを無視してください。
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2024 JC-Ticket. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw new Error('Failed to send password reset email');
  }
};
