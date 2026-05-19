import * as crypto from 'crypto';

const secret = 'SECRET123';
const data = 'vnp_Amount=5000000&vnp_Command=pay&vnp_CreateDate=20240101000000&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Test+Payment&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%2Freturn&vnp_TmnCode=TMNCODE123&vnp_TxnRef=ORD123&vnp_Version=2.1.0';
const hmac = crypto.createHmac('sha512', secret);
const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
console.log('Test Sign (Test+Payment):', signed);

const data2 = 'vnp_Amount=5000000&vnp_Command=pay&vnp_CreateDate=20240101000000&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Test%20Payment&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%2Freturn&vnp_TmnCode=TMNCODE123&vnp_TxnRef=ORD123&vnp_Version=2.1.0';
const hmac2 = crypto.createHmac('sha512', secret);
const signed2 = hmac2.update(Buffer.from(data2, 'utf-8')).digest('hex');
console.log('Test Sign (Test%20Payment):', signed2);
