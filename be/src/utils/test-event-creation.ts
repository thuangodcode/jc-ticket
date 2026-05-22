import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event } from '../models/Event';

dotenv.config();

async function runTest() {
  console.log('=== Backend Event ticketTypes Field Test ===');
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create a test event with ticketTypes
    console.log('\nCreating test event...');
    const testEventData = {
      title: 'Automated Test Event - TicketTypes',
      description: 'Testing if the Mongoose schema correctly saves and retrieves ticket types array.',
      category: 'anime',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&h=600&fit=crop',
      date: new Date('2026-09-15T09:00:00'),
      endDate: new Date('2026-09-15T18:00:00'),
      location: 'Test City',
      venue: 'Test Exhibition Center',
      price: 150000,
      vipPrice: 300000,
      totalSeats: 100,
      availableSeats: 100,
      seatMap: { rows: 10, seatsPerRow: 10, vipRows: [0, 1], reservedSeats: [] },
      organizer: 'Automated Test Systems',
      status: 'draft',
      tags: ['test', 'integration'],
      ticketTypes: [
        { name: 'Regular', price: 150000, quantity: 80 },
        { name: 'VIP', price: 300000, quantity: 20 }
      ]
    };

    const createdEvent = await Event.create(testEventData as any);
    console.log(`✅ Test event created successfully with ID: ${createdEvent._id}`);

    // 2. Retrieve event from database to verify ticketTypes
    console.log('\nRetrieving event from database...');
    const fetchedEvent = await Event.findById(createdEvent._id) as any;
    if (!fetchedEvent) {
      throw new Error('Could not find the created test event in database!');
    }

    console.log('Verifying fields...');
    const ticketTypes = fetchedEvent.ticketTypes;
    if (!ticketTypes || ticketTypes.length !== 2) {
      throw new Error(`Expected 2 ticketTypes, found: ${ticketTypes ? ticketTypes.length : 'none'}`);
    }

    console.log('✅ Found ticketTypes array:');
    ticketTypes.forEach((t: any, i: number) => {
      console.log(`   [Type ${i+1}] Name: "${t.name}", Price: ${t.price} VND, Qty: ${t.quantity}`);
    });

    if (ticketTypes[0].name !== 'Regular' || ticketTypes[0].price !== 150000 || ticketTypes[0].quantity !== 80) {
      throw new Error('First ticket type data mismatch!');
    }

    if (ticketTypes[1].name !== 'VIP' || ticketTypes[1].price !== 300000 || ticketTypes[1].quantity !== 20) {
      throw new Error('Second ticket type data mismatch!');
    }

    console.log('✅ ticketTypes values match expectations perfectly!');

    // 3. Clean up
    console.log('\nCleaning up test event...');
    await Event.findByIdAndDelete(createdEvent._id);
    console.log('✅ Test event deleted');

  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

runTest();
