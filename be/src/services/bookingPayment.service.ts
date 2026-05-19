import { Booking } from '../models/Booking';
import { generateTickets } from '../utils/ticketGenerator';
import { sendTicketEmail } from '../utils/ticketEmail';

export async function confirmBookingAndIssueTickets(options: {
  bookingId: string;
  paymentMethod: string;
  paymentId?: string;
  skipIfAlreadySuccessful?: boolean;
}) {
  const { bookingId, paymentMethod, paymentId, skipIfAlreadySuccessful = true } = options;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  if (skipIfAlreadySuccessful && booking.paymentStatus === 'successful') {
    return { booking, tickets: [], alreadyConfirmed: true };
  }

  booking.paymentStatus = 'successful';
  booking.status = 'confirmed';
  booking.confirmedAt = new Date();
  booking.paymentMethod = paymentMethod as any;
  if (paymentId) {
    booking.paymentId = paymentId;
  }

  await booking.save();

  const tickets = await generateTickets(booking._id.toString());

  void (async () => {
    const populatedBooking = await Booking.findById(booking._id).populate('eventId');
    if (populatedBooking) {
      await sendTicketEmail(populatedBooking as any, tickets);
    }
  })();

  return { booking, tickets, alreadyConfirmed: false };
}
