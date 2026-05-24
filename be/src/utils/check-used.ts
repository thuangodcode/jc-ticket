import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Ticket } from '../models/Ticket';
import { Event } from '../models/Event';
import { Booking } from '../models/Booking';

dotenv.config();

const run = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI not defined');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');
    console.log('Registering models:', Event.modelName, Booking.modelName);

    const totalTickets = await Ticket.countDocuments({});
    console.log('Total tickets in database:', totalTickets);

    const usedTickets = await Ticket.find({ status: 'used' })
      .populate('eventId', 'title')
      .sort({ updatedAt: -1 });

    console.log('Used tickets count:', usedTickets.length);
    usedTickets.forEach((t: any) => {
      console.log(`- Code: ${t.ticketCode}, Passenger: ${t.passengerName}, Event: ${t.eventId?.title}, Used At: ${t.usedAt}, Updated At: ${t.updatedAt}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
