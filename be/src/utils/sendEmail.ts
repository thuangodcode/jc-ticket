import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const normalizeEmailAddress = (value?: string) => (value || '').replace(/[<>]/g, '').trim();
const normalizeAppPassword = (value?: string) => (value || '').replace(/\s+/g, '').trim();

// 30s timeout cho SMTP fallback (cloud latency)
const EMAIL_SEND_TIMEOUT_MS = 30000;

const withTimeout = async <T>(promise: Promise<T>, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timed out after ${EMAIL_SEND_TIMEOUT_MS}ms`)),
      EMAIL_SEND_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

/**
 * === EMAIL PROVIDER STRATEGY ===
 *
 * PRIMARY:  SendGrid HTTP API  (SENDGRID_API_KEY set)
 *           → Works on Render free tier (HTTP, không dùng SMTP port)
 *           → 100 emails/day free
 *
 * FALLBACK: Nodemailer SMTP   (khi không có SENDGRID_API_KEY)
 *           → Hoạt động local, có thể bị block trên Render free tier
 */

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

const FROM_ADDRESS =
  process.env.EMAIL_FROM ||
  `JC-Ticket <${process.env.GMAIL_EMAIL || 'noreply@jcticket.app'}>`;

/**
 * Gửi email qua SendGrid HTTP API
 * Không dùng SMTP port → luôn hoạt động trên cloud
 */
const sendViaSendGrid = async ({ to, subject, html }: MailPayload): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY!;
  sgMail.setApiKey(apiKey);

  // SendGrid cần "from" là email đã verify (Single Sender Verification)
  const from = FROM_ADDRESS;

  await sgMail.send({ to, from, subject, html });
  console.log(`✅ [SendGrid] Email sent to ${to}`);
};

/**
 * Gửi email qua Nodemailer SMTP (fallback)
 * Port 587 + STARTTLS - có thể bị block trên Render free tier
 */
const sendViaNodemailer = async ({ to, subject, html }: MailPayload): Promise<void> => {
  const gmailUser = normalizeEmailAddress(process.env.GMAIL_EMAIL);
  const gmailPass = normalizeAppPassword(process.env.GMAIL_APP_PASSWORD);

  if (!gmailUser || !gmailPass) {
    throw new Error('Missing email credentials: GMAIL_EMAIL or GMAIL_APP_PASSWORD not set');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,      // STARTTLS
    requireTLS: true,
    auth: { user: gmailUser, pass: gmailPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 25000,
  });

  await withTimeout(
    transporter.sendMail({ from: FROM_ADDRESS, to, subject, html }),
    'Nodemailer SMTP email'
  );
  console.log(`✅ [Nodemailer] Email sent to ${to}`);
};

/**
 * Core email sender - auto-selects provider
 */
const sendEmail = async (payload: MailPayload): Promise<void> => {
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(payload);
  }
  console.warn('⚠️ SENDGRID_API_KEY not set, falling back to Nodemailer SMTP (may fail on Render)');
  return sendViaNodemailer(payload);
};

/**
 * Send verification OTP email (Registration)
 */
export const sendVerificationOTP = async (
  email: string,
  name: string,
  otp: string
): Promise<void> => {
  try {
    await sendEmail({
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
              © ${new Date().getFullYear()} JC-Ticket. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
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
    await sendEmail({
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
              © ${new Date().getFullYear()} JC-Ticket. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw new Error('Failed to send password reset email');
  }
};
