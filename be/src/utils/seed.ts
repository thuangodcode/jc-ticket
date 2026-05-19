import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Event } from '../models/Event';

dotenv.config();

/**
 * Seed Script - Tạo dữ liệu mẫu cho events
 * Chạy: npx ts-node src/utils/seed.ts
 */

const sampleEvents = [
  {
    title: 'Anime Festival Việt Nam 2026',
    description: 'Lễ hội Anime & Manga lớn nhất Việt Nam với hơn 200 gian hàng, cosplay contest, meet & greet nghệ sĩ Nhật Bản, và nhiều hoạt động hấp dẫn. Đặc biệt có sự tham gia của các seiyuu nổi tiếng từ Tokyo.',
    category: 'anime',
    image: 'https://images.unsplash.com/photo-1611339555312-e607c849352d?w=800&h=600&fit=crop',
    date: new Date('2026-07-15T09:00:00'),
    endDate: new Date('2026-07-17T21:00:00'),
    location: 'TP. Hồ Chí Minh',
    venue: 'Trung tâm Hội nghị & Triển lãm Sài Gòn (SECC)',
    price: 250000,
    vipPrice: 500000,
    totalSeats: 120,
    availableSeats: 120,
    seatMap: { rows: 10, seatsPerRow: 12, vipRows: [0, 1], reservedSeats: [] },
    organizer: 'JC-Entertainment Group',
    status: 'active',
    tags: ['anime', 'manga', 'cosplay', 'japan'],
    rating: 4.8,
    attendees: 5200,
  },
  {
    title: 'J-Rock Live Concert: ONE OK ROCK',
    description: 'Đêm nhạc Rock Nhật Bản với sự trình diễn của ONE OK ROCK. Trải nghiệm âm nhạc đỉnh cao với âm thanh sống động và hiệu ứng ánh sáng ấn tượng.',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1522383150241-6c85ef20cecc?w=800&h=600&fit=crop',
    date: new Date('2026-08-20T19:00:00'),
    endDate: new Date('2026-08-20T23:00:00'),
    location: 'Hà Nội',
    venue: 'Cung Văn hóa Hữu nghị Việt Xô',
    price: 1200000,
    vipPrice: 2500000,
    totalSeats: 96,
    availableSeats: 96,
    seatMap: { rows: 8, seatsPerRow: 12, vipRows: [0, 1, 2], reservedSeats: [] },
    organizer: 'JC-Entertainment Group',
    status: 'active',
    tags: ['j-rock', 'concert', 'live-music'],
    rating: 4.9,
    attendees: 8900,
  },
  {
    title: 'Summer Matsuri - Lễ hội Mùa hè Nhật Bản',
    description: 'Trải nghiệm lễ hội Natsu Matsuri đậm chất Nhật Bản giữa lòng Sài Gòn. Pháo hoa, yukata, trò chơi truyền thống, và ẩm thực đường phố Nhật.',
    category: 'traditional',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
    date: new Date('2026-06-28T17:00:00'),
    endDate: new Date('2026-06-28T22:00:00'),
    location: 'TP. Hồ Chí Minh',
    venue: 'Công viên Gia Định',
    price: 450000,
    vipPrice: 800000,
    totalSeats: 120,
    availableSeats: 120,
    seatMap: { rows: 10, seatsPerRow: 12, vipRows: [0, 1], reservedSeats: [] },
    organizer: 'Vietnam-Japan Cultural Exchange',
    status: 'active',
    tags: ['matsuri', 'festival', 'traditional', 'summer'],
    rating: 4.7,
    attendees: 3400,
  },
  {
    title: 'Ramen & Sushi Festival',
    description: 'Lễ hội ẩm thực Nhật Bản quy mô lớn nhất năm. Thưởng thức ramen, sushi, takoyaki từ 50+ đầu bếp Nhật Bản chính hiệu. Có khu vực workshop nấu ăn.',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce017fd4351?w=800&h=600&fit=crop',
    date: new Date('2026-09-05T10:00:00'),
    endDate: new Date('2026-09-07T21:00:00'),
    location: 'Đà Nẵng',
    venue: 'Công viên Biển Đông',
    price: 150000,
    vipPrice: 300000,
    totalSeats: 120,
    availableSeats: 120,
    seatMap: { rows: 10, seatsPerRow: 12, vipRows: [0, 1], reservedSeats: [] },
    organizer: 'Danang Food Tourism',
    status: 'active',
    tags: ['food', 'ramen', 'sushi', 'japanese-cuisine'],
    rating: 4.6,
    attendees: 2800,
  },
  {
    title: 'Sakura Viewing Tour - Hoa anh đào tại Đà Lạt',
    description: 'Tour ngắm hoa anh đào Nhật Bản (Prunus serrulata) được trồng tại Đà Lạt. Bao gồm trà đạo, kimono photo shoot và picnic dưới tán hoa.',
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1533636786983-cbca32511b39?w=800&h=600&fit=crop',
    date: new Date('2026-12-20T08:00:00'),
    endDate: new Date('2026-12-20T17:00:00'),
    location: 'Đà Lạt',
    venue: 'Vườn hoa Đà Lạt',
    price: 180000,
    vipPrice: 350000,
    totalSeats: 60,
    availableSeats: 60,
    seatMap: { rows: 5, seatsPerRow: 12, vipRows: [0], reservedSeats: [] },
    organizer: 'JC-Travel',
    status: 'active',
    tags: ['sakura', 'travel', 'dalat', 'nature'],
    rating: 4.5,
    attendees: 1950,
  },
  {
    title: 'Japan Art Exhibition - Triển lãm Nghệ thuật Nhật Bản',
    description: 'Triển lãm nghệ thuật đương đại Nhật Bản với 100+ tác phẩm từ các nghệ sĩ hàng đầu. Bao gồm ukiyo-e, sumi-e, và digital art hiện đại.',
    category: 'seasonal',
    image: 'https://images.unsplash.com/photo-1493976040803-0f6688e74d11?w=800&h=600&fit=crop',
    date: new Date('2026-10-10T09:00:00'),
    endDate: new Date('2026-10-15T18:00:00'),
    location: 'TP. Hồ Chí Minh',
    venue: 'Bảo tàng Mỹ thuật TP.HCM',
    price: 2500000,
    vipPrice: 5000000,
    totalSeats: 60,
    availableSeats: 60,
    seatMap: { rows: 5, seatsPerRow: 12, vipRows: [0], reservedSeats: [] },
    organizer: 'Japan Foundation Vietnam',
    status: 'active',
    tags: ['art', 'exhibition', 'contemporary', 'gallery'],
    rating: 4.9,
    attendees: 456,
  },
];

const seedEvents = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI not defined');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Xóa events cũ
    await Event.deleteMany({});
    console.log('🗑️ Cleared old events');

    // Tạo events mới
    const created = await Event.insertMany(sampleEvents);
    console.log(`✅ Seeded ${created.length} events`);

    created.forEach((e) => {
      console.log(`  📌 ${e.title} (${e._id})`);
    });

    await mongoose.disconnect();
    console.log('✅ Done! Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedEvents();
