import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
 * PRIMARY:   Resend HTTP API   (RESEND_API_KEY set)
 *           → Works on Render free tier (HTTP, không dùng SMTP port)
 *           → 3000 emails/month free
 *
 * SECONDARY: SendGrid HTTP API  (SENDGRID_API_KEY set)
 *           → 100 emails/day free
 *
 * FALLBACK:  Nodemailer SMTP   (khi không có các API key trên)
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
 * Gửi email qua Resend HTTP API
 * Không dùng SMTP port → luôn hoạt động trên cloud
 */
const sendViaResend = async ({ to, subject, html }: MailPayload): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY!;
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (response.error) {
    throw new Error(`Resend error: ${response.error.message}`);
  }

  console.log(`✅ [Resend] Email sent to ${to}`);
};

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
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(payload);
  }
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid(payload);
  }
  console.warn('⚠️ RESEND_API_KEY and SENDGRID_API_KEY not set, falling back to Nodemailer SMTP (may fail on Render)');
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

/**
 * Send a beautiful welcome/confirmation email for newsletter subscription
 */
export const sendWelcomeNewsletterEmail = async (email: string): Promise<void> => {
  try {
    await sendEmail({
      to: email,
      subject: '🌸 Chào mừng bạn đến với JC-Ticket - Đăng ký nhận tin thành công! 🌸',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fa; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 5px solid #FF5A79;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FF5A79 0%, #FF8E53 100%); padding: 35px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">JC-Ticket</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px; font-style: italic;">Cổng thông tin Lễ hội Nhật Bản & Sự kiện Âm nhạc hàng đầu</p>
            </div>

            <!-- Content Body -->
            <div style="padding: 40px 30px; color: #333333; line-height: 1.8;">
              <h2 style="color: #2c3e50; font-size: 20px; margin-top: 0; font-weight: 600;">Xin chào bạn,</h2>
              
              <p style="font-size: 15px; margin-bottom: 20px;">
                Cảm ơn bạn đã quan tâm và đăng ký nhận thông tin sự kiện mới từ <strong>JC-Ticket</strong>. Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình khám phá những lễ hội tuyệt vời nhất!
              </p>

              <p style="font-size: 15px; margin-bottom: 25px;">
                Kể từ bây giờ, bạn sẽ là một trong những người đầu tiên nhận được:
              </p>

              <div style="background-color: #fff8f8; border-left: 4px solid #FF5A79; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #555555;">
                  <li style="margin-bottom: 8px;">🔥 Thông tin sớm nhất về các lễ hội văn hóa Nhật Bản và nhạc hội lớn.</li>
                  <li style="margin-bottom: 8px;">🎟️ Vé mở bán sớm (Early Bird) với các ưu đãi độc quyền hấp dẫn.</li>
                  <li style="margin-bottom: 0;">🎁 Quà tặng bất ngờ, mini-game và code giảm giá dành riêng cho thành viên nhận tin.</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="https://jc-ticket.onrender.com" target="_blank" style="background-color: #FF5A79; color: #ffffff; padding: 12px 30px; text-decoration: none; font-weight: 600; border-radius: 30px; display: inline-block; box-shadow: 0 4px 10px rgba(255, 90, 121, 0.3); transition: all 0.3s ease;">
                  Khám Phá Sự Kiện Ngay
                </a>
              </div>

              <p style="font-size: 14px; color: #7f8c8d; margin-bottom: 0; line-height: 1.6;">
                Nếu bạn có bất kỳ câu hỏi nào hoặc cần hỗ trợ đặt vé, đừng ngần ngại trả lời email này hoặc liên hệ hotline hỗ trợ của chúng tôi qua website nhé.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #fcfcfc; border-top: 1px solid #f1f2f6; padding: 25px 30px; text-align: center;">
              <p style="font-size: 12px; color: #95a5a6; margin: 0 0 10px 0;">
                Bạn nhận được email này vì đã đăng ký nhận tin tại trang web của chúng tôi. 
              </p>
              <p style="font-size: 12px; color: #bdc3c7; margin: 0;">
                © ${new Date().getFullYear()} JC-Ticket. Mọi quyền được bảo lưu.
              </p>
            </div>

          </div>
        </div>
      `,
    });
    console.log(`✅ [Newsletter Welcome Email] Sent successfully to ${email}`);
  } catch (error) {
    console.error('Error sending welcome newsletter email:', error);
    // don't throw to avoid disrupting subscription API return status
  }
};

