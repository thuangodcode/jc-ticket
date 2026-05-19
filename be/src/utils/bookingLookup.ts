import mongoose from 'mongoose';
import { Booking } from '../models/Booking';

/** Tìm booking theo vnp_TxnRef (bookingCode hoặc MongoDB _id). */
export async function findBookingByTxnRef(txnRef: string) {
  if (mongoose.Types.ObjectId.isValid(txnRef)) {
    const byId = await Booking.findById(txnRef);
    if (byId) return byId;
  }
  return Booking.findOne({ bookingCode: txnRef });
}
