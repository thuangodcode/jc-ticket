import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { ITicket } from '../models/Ticket';
import { IBooking } from '../models/Booking';
import { IEvent } from '../models/Event';

/**
 * Ticket Email Utility
 * Gửi email xác nhận vé cho khách hàng sau khi thanh toán thành công
 */

const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';

  if (emailService === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Generate QR code as base64 data URL
 */
const generateQRBase64 = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#FFFFFF' },
    });
  } catch (err) {
    console.error('QR generation error:', err);
    return '';
  }
};

/**
 * Format price sang VND
 */
const formatPrice = (price: number): string => {
  return price.toLocaleString('vi-VN') + '₫';
};

/**
 * Format date sang tiếng Việt
 */
const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Gửi email vé cho khách hàng
 */
export const sendTicketEmail = async (
  booking: IBooking & { eventId: IEvent },
  tickets: ITicket[]
): Promise<void> => {
  try {
    const transporter = createTransporter();
    const event = booking.eventId;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Generate QR codes cho tất cả tickets
    const ticketRows: string[] = [];
    for (const ticket of tickets) {
      const qrBase64 = await generateQRBase64(ticket.qrCodeData);
      ticketRows.push(`
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; text-align: center;">
            <img src="${qrBase64}" alt="QR ${ticket.ticketCode}" width="120" height="120" />
          </td>
          <td style="padding: 12px;">
            <p style="margin: 0 0 4px; font-weight: bold; color: #DC143C; font-size: 14px;">${ticket.ticketCode}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #333;">Ghế: <strong>${ticket.seatNumber}</strong></p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #333;">Loại: <strong>${ticket.ticketType === 'vip' ? '🌟 VIP' : '🎫 Standard'}</strong></p>
            <p style="margin: 0; font-size: 13px; color: #DC143C; font-weight: bold;">${formatPrice(ticket.price)}</p>
          </td>
        </tr>
      `);
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_EMAIL,
      to: booking.passengerInfo.email,
      subject: `🎫 JC-Ticket - Vé của bạn cho "${event.title}" đã sẵn sàng!`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #DC143C, #FF69B4); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0 0 8px; font-size: 28px;">✦ JC-Ticket</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 14px;">Đặt vé sự kiện hàng đầu Việt Nam</p>
            </div>

            <!-- Success Banner -->
            <div style="background-color: #10B981; padding: 16px; text-align: center;">
              <p style="color: white; margin: 0; font-size: 18px; font-weight: bold;">✅ Thanh toán thành công!</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                Xin chào <strong>${booking.passengerInfo.name}</strong>,
              </p>
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px;">
                Cảm ơn bạn đã đặt vé qua JC-Ticket! Vé điện tử của bạn đã được tạo thành công. 
                Vui lòng xuất trình mã QR bên dưới khi vào cửa.
              </p>

              <!-- Event Info -->
              <div style="background-color: #FFF8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #FFE0CC;">
                <h2 style="color: #DC143C; margin: 0 0 12px; font-size: 20px;">🎌 ${event.title}</h2>
                <p style="margin: 4px 0; color: #555; font-size: 14px;">📅 ${formatDate(event.date)}</p>
                <p style="margin: 4px 0; color: #555; font-size: 14px;">📍 ${event.venue}, ${event.location}</p>
                <p style="margin: 4px 0; color: #555; font-size: 14px;">👤 ${booking.passengerInfo.name}</p>
                <p style="margin: 4px 0; color: #555; font-size: 14px;">📞 ${booking.passengerInfo.phone}</p>
                <p style="margin: 8px 0 0; color: #DC143C; font-size: 16px; font-weight: bold;">
                  💰 Tổng: ${formatPrice(booking.totalPrice)}
                </p>
              </div>

              <!-- Booking Code -->
              <div style="background-color: #f9f9f9; border: 2px dashed #DC143C; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <p style="font-size: 12px; color: #999; margin: 0 0 6px;">Mã đặt vé</p>
                <p style="font-size: 24px; font-weight: bold; color: #DC143C; letter-spacing: 3px; margin: 0;">${booking.bookingCode}</p>
              </div>

              <!-- Tickets Table -->
              <h3 style="color: #333; margin-bottom: 12px;">🎫 Chi tiết vé (${tickets.length} vé)</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #eee; border-radius: 8px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 10px; text-align: center; font-size: 13px; color: #666;">Mã QR</th>
                    <th style="padding: 10px; text-align: left; font-size: 13px; color: #666;">Thông tin vé</th>
                  </tr>
                </thead>
                <tbody>
                  ${ticketRows.join('')}
                </tbody>
              </table>

              <!-- View Online Button -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${frontendUrl}/my-tickets" 
                   style="display: inline-block; background-color: #DC143C; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                  📱 Xem vé trực tuyến
                </a>
              </div>

              <!-- Important Note -->
              <div style="background-color: #FEF3C7; border-radius: 8px; padding: 14px; margin-top: 20px;">
                <p style="color: #92400E; font-size: 13px; margin: 0; line-height: 1.5;">
                  ⚠️ <strong>Lưu ý:</strong> Vui lòng không chia sẻ mã QR cho người khác. 
                  Mỗi mã QR chỉ được sử dụng 1 lần tại cổng vào.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #1A1A1A; padding: 20px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 4px;">
                © ${new Date().getFullYear()} JC-Ticket. All rights reserved.
              </p>
              <p style="color: #666; font-size: 11px; margin: 0;">
                Email này được gửi tự động. Vui lòng không reply.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Ticket email sent to ${booking.passengerInfo.email}`);
  } catch (error) {
    console.error('❌ Error sending ticket email:', error);
    // Không throw - email fail không nên block flow chính
  }
};
