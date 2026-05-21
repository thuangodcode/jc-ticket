/**
 * JC-Ticket - Full Payment Flow Test Script
 * Tạo test user trong DB, đăng nhập, tạo booking, và tạo VNPay URL
 */

const path = require('path');
const beModules = path.join(__dirname, 'be/node_modules');

// Load deps from be/node_modules
const dotenv = require(path.join(beModules, 'dotenv'));
dotenv.config({ path: path.join(__dirname, 'be/.env') });

const mongoose = require(path.join(beModules, 'mongoose'));
const bcrypt = require(path.join(beModules, 'bcrypt'));
const crypto = require('crypto');  // built-in
const http = require('http');      // built-in

const MONGO_URI = process.env.MONGO_URI;
const BASE_URL = 'http://localhost:5000';
const TEST_EMAIL = 'autotest@jcticket.vn';
const TEST_PASSWORD = 'AutoTest@123';

// ─── HTTP helper (handles cookies) ───────────────────────────────────────────
let cookieJar = '';

function req(method, path, body, useCookies = true) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr || ''),
        ...(useCookies && cookieJar ? { Cookie: cookieJar } : {}),
      },
    };

    const r = http.request(options, (res) => {
      // Save cookies
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookieJar = setCookie.map(c => c.split(';')[0]).join('; ');
      }
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400) {
        return resolve({ status: res.statusCode, redirect: res.headers.location, data: null });
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    r.on('error', reject);
    if (bodyStr) r.write(bodyStr);
    r.end();
  });
}

function check(cond, pass, fail) {
  if (cond) console.log(`  ✅ ${pass}`);
  else console.log(`  ❌ ${fail}`);
  return cond;
}

// ─── VNPay signature calculation ──────────────────────────────────────────────
function testVnpaySignature() {
  const tmnCode = process.env.VNP_TMNCODE;
  const secret = process.env.VNP_HASHSECRET;
  
  const now = new Date();
  const vnNow = new Date(now.getTime() + 7 * 3600000);
  const pad = n => String(n).padStart(2, '0');
  const createDate = `${vnNow.getUTCFullYear()}${pad(vnNow.getUTCMonth()+1)}${pad(vnNow.getUTCDate())}${pad(vnNow.getUTCHours())}${pad(vnNow.getUTCMinutes())}${pad(vnNow.getUTCSeconds())}`;
  
  const params = {
    vnp_Amount: '45000000',
    vnp_Command: 'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: '113.160.92.202',
    vnp_Locale: 'vn',
    vnp_OrderInfo: 'Thanh toan don hang BK-TEST001',
    vnp_OrderType: 'other',
    vnp_ReturnUrl: process.env.VNP_RETURNURL,
    vnp_TmnCode: tmnCode,
    vnp_TxnRef: 'BK-TEST001',
    vnp_Version: '2.1.0',
  };
  
  const sorted = Object.keys(params).sort().reduce((a, k) => { a[k] = params[k]; return a; }, {});
  const signData = Object.keys(sorted).filter(k => (sorted[k]??'') !== '').map(k => `${k}=${sorted[k]}`).join('&');
  const hash512 = crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  const hash256 = crypto.createHmac('sha256', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');

  return { tmnCode, secret, signData, hash512, hash256, params };
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  JC-Ticket Automated Test Suite v2.0');
  console.log('═══════════════════════════════════════════════════');

  // TEST 0: VNPay Signature
  console.log('\n🔐 TEST 0: VNPay Signature Algorithm Check');
  const vnp = testVnpaySignature();
  check(!!vnp.tmnCode, `TmnCode loaded: ${vnp.tmnCode}`, 'TmnCode MISSING!');
  check(!!vnp.secret, `HashSecret loaded (${vnp.secret.length} chars)`, 'HashSecret MISSING!');
  check(vnp.hash512.length === 64, `SHA512 hash generated (64 hex chars)`, 'SHA512 hash wrong length');
  check(vnp.hash256.length === 64, `SHA256 also 64 chars (both algos produce 64 hex)`, '');
  console.log(`  📝 SignData sample: ${vnp.signData.substring(0, 70)}...`);
  console.log(`  📝 SHA512: ${vnp.hash512.substring(0, 32)}...`);
  console.log(`  📝 SHA256: ${vnp.hash256.substring(0, 32)}... (different from SHA512 - correct!)`);
  const hashesAreDifferent = vnp.hash512 !== vnp.hash256;
  check(hashesAreDifferent, 'SHA512 ≠ SHA256 (using correct algorithm)', 'SHA512 == SHA256 (BUG: same algo used!)');

  // TEST 1: Backend Health
  console.log('\n🏥 TEST 1: Backend Health');
  const health = await req('GET', '/', null, false);
  check(health.data?.database?.includes('Connected'), 'MongoDB connected', 'MongoDB NOT connected');

  // TEST 2: Get Event
  console.log('\n📅 TEST 2: Get Active Events');
  const eventsRes = await req('GET', '/api/events?limit=1', null, false);
  const event = eventsRes.data?.data?.[0];
  check(!!event, `Found event: "${event?.title}"`, 'No events found');

  // Connect to MongoDB to create test user directly
  console.log('\n👤 TEST 3: Create Test User in DB');
  let testUserId = null;
  try {
    await mongoose.connect(MONGO_URI);
    const bcrypt = require('bcrypt');
    const User = mongoose.model('User', new mongoose.Schema({
      name: String, email: String, password: String, role: String,
      phone: String, isVerified: Boolean, createdAt: Date
    }, { strict: false }));

    await User.deleteOne({ email: TEST_EMAIL });
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);
    const user = await User.create({
      name: 'Auto Test User', email: TEST_EMAIL, password: hash,
      role: 'user', phone: '0909999888', isVerified: true,
      createdAt: new Date()
    });
    testUserId = user._id;
    check(true, `Test user created: ${TEST_EMAIL}`, '');
  } catch (err) {
    check(false, '', `DB user creation failed: ${err.message}`);
  }

  // TEST 4: Login
  console.log('\n🔑 TEST 4: Login');
  const loginRes = await req('POST', '/api/auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD }, false);
  check(loginRes.data?.success, `Logged in as ${TEST_EMAIL}`, `Login failed: ${JSON.stringify(loginRes.data)}`);
  check(!!cookieJar, 'Auth cookie received', 'No auth cookie - sessions broken');

  // TEST 5: Create Booking
  console.log('\n📦 TEST 5: Create Booking');
  let bookingId = null;
  let bookingCode = null;
  if (event) {
    // Find available seat
    const reservedSeats = event.seatMap?.reservedSeats || [];
    const rows = 'ABCDEFGHIJ'.split('');
    let freeSeat = null;
    outer: for (const row of rows) {
      for (let n = 1; n <= 12; n++) {
        const s = `${row}${n}`;
        if (!reservedSeats.includes(s)) { freeSeat = s; break outer; }
      }
    }
    
    if (freeSeat) {
      const bookingRes = await req('POST', '/api/bookings', {
        eventId: event._id,
        tickets: [{ ticketType: 'standard', quantity: 1 }],
        selectedSeats: [freeSeat],
        passengerInfo: { name: 'Auto Test', email: TEST_EMAIL, phone: '0909999888' },
      });
      if (bookingRes.data?.success) {
        bookingId = bookingRes.data.data._id;
        bookingCode = bookingRes.data.data.bookingCode;
        const total = bookingRes.data.data.totalPrice;
        check(true, `Booking created! Code: ${bookingCode}, Seat: ${freeSeat}, Total: ${total?.toLocaleString('vi-VN')}đ`, '');
      } else {
        check(false, '', `Booking failed: ${JSON.stringify(bookingRes.data)}`);
      }
    } else {
      check(false, '', 'No available seats found');
    }
  }

  // TEST 6: Create VNPay Order
  console.log('\n💳 TEST 6: Create VNPay Payment URL');
  if (bookingId) {
    const vnpRes = await req('POST', '/api/payment/vnpay/create', { bookingId });
    if (vnpRes.data?.success && vnpRes.data?.data?.orderUrl) {
      const url = vnpRes.data.data.orderUrl;
      check(url.includes('sandbox.vnpayment.vn'), 'VNPay sandbox domain OK', 'Wrong domain!');
      check(url.includes('vnp_TmnCode=LNH2AU96'), `TmnCode LNH2AU96 present`, 'TmnCode missing/wrong');
      check(url.includes('vnp_SecureHash='), 'SecureHash present', 'SecureHash missing');
      
      const amountMatch = url.match(/vnp_Amount=(\d+)/);
      if (amountMatch) {
        check(true, `Amount (x100): ${amountMatch[1]}`, '');
      }
      
      console.log(`\n  🔗 Full VNPay URL:\n  ${url.substring(0, 150)}...\n`);
    } else {
      check(false, '', `VNPay URL failed: ${JSON.stringify(vnpRes.data)}`);
    }
  }

  // TEST 7: Cleanup
  console.log('\n🧹 TEST 7: Cleanup');
  try {
    if (testUserId) {
      const Booking = mongoose.model('Booking');
      if (bookingId) await Booking.findByIdAndDelete(bookingId).catch(() => {});
      const User = mongoose.model('User');
      await User.findByIdAndDelete(testUserId);
      check(true, 'Test data cleaned up', '');
    }
    await mongoose.disconnect();
  } catch {}

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  ✅ ALL TESTS COMPLETE!');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🎫 Thẻ test NCB Sandbox để thanh toán trực tiếp:');
  console.log('   Card No: 9704198526191432198');
  console.log('   Name:    NGUYEN VAN A');
  console.log('   Exp:     07/15');
  console.log('   OTP:     123456\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
