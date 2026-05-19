import { Ticket, ITicket } from '../models/Ticket';
import { Booking } from '../models/Booking';
import { Event } from '../models/Event';

/**
 * Ticket Generator Utility
 * Tạo vé điện tử sau khi thanh toán thành công
 */

/**
 * Tạo mã vé unique: VE + YYMMDD + 4 digit sequence
 * Ví dụ: VE2605190001, VE2605190002
 */
export const generateTicketCode = async (): Promise<string> => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `VE${yy}${mm}${dd}`;

  // Tìm số vé cao nhất trong ngày hôm nay để tăng sequence
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const lastTicket = await Ticket.findOne({
    ticketCode: { $regex: `^${prefix}` },
    createdAt: { $gte: todayStart, $lt: todayEnd },
  }).sort({ ticketCode: -1 });

  let sequence = 1;
  if (lastTicket) {
    const lastSeq = parseInt(lastTicket.ticketCode.slice(-4));
    sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

/**
 * Generate QR Code data JSON cho 1 vé
 */
export const generateQRData = (ticket: {
  ticketCode: string;
  eventTitle: string;
  date: Date;
  seatNumber: string;
  passengerName: string;
  ticketType: string;
}): string => {
  const verifyUrl = `http://localhost:5173/verify-ticket/${ticket.ticketCode}`;

  return JSON.stringify({
    code: ticket.ticketCode,
    event: ticket.eventTitle,
    date: ticket.date.toISOString(),
    seat: ticket.seatNumber,
    passenger: ticket.passengerName,
    type: ticket.ticketType,
    verify: verifyUrl,
  });
};

/**
 * Tạo tất cả vé cho 1 booking đã thanh toán thành công
 * Mỗi ghế = 1 ticket
 */
export const generateTickets = async (bookingId: string): Promise<ITicket[]> => {
  const booking = await Booking.findById(bookingId).populate('eventId');
  if (!booking) throw new Error('Booking not found');

  const event = await Event.findById(booking.eventId);
  if (!event) throw new Error('Event not found');

  // Kiểm tra đã tạo vé chưa (prevent duplicate)
  const existingTickets = await Ticket.find({ bookingId: booking._id });
  if (existingTickets.length > 0) {
    console.log(`⚠️ Tickets already exist for booking ${booking.bookingCode}`);
    return existingTickets;
  }

  const tickets: ITicket[] = [];
  const seats = booking.selectedSeats;

  // Tạo 1 ticket cho mỗi ghế đã chọn
  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i]!;

    // Xác định loại vé dựa trên hàng ghế
    const rowLetter = seat.charAt(0);
    const rowIndex = rowLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    const isVip = event.seatMap.vipRows.includes(rowIndex);
    const ticketType = isVip ? 'vip' : 'standard';
    const price = isVip ? (event.vipPrice || event.price * 1.5) : event.price;

    const ticketCode = await generateTicketCode();

    const qrData = generateQRData({
      ticketCode,
      eventTitle: event.title,
      date: event.date,
      seatNumber: seat,
      passengerName: booking.passengerInfo.name,
      ticketType,
    });

    const ticket = await Ticket.create({
      ticketCode,
      bookingId: booking._id,
      eventId: event._id,
      userId: booking.userId,
      passengerName: booking.passengerInfo.name,
      passengerEmail: booking.passengerInfo.email,
      passengerPhone: booking.passengerInfo.phone,
      seatNumber: seat,
      ticketType,
      price,
      qrCodeData: qrData,
      status: 'active',
      issuedAt: new Date(),
    } as any);

    tickets.push(ticket);
  }

  console.log(`✅ Generated ${tickets.length} tickets for booking ${booking.bookingCode}`);
  return tickets;
};
