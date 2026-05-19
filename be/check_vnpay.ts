import * as VNPayPackage from 'vnpay';
import * as crypto from 'crypto';

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key] ?? '';
      return sorted;
    }, {} as Record<string, string>);
}

function buildSignData(obj: Record<string, string>): string {
  return Object.keys(obj)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key] ?? '')}`)
    .join('&');
}

function buildVNPayUrlManual(params: any, tmnCode: string, secret: string) {
  const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const createDate = '20240101000000';
  const rawParams: Record<string, string> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(params.amount * 100),
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: params.ipAddr,
    vnp_Locale: params.locale || 'vn',
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: params.returnUrl,
    vnp_TxnRef: params.txnRef,
  };
  const sorted = sortObject(rawParams);
  const signData = buildSignData(sorted);
  const hmac = crypto.createHmac('sha512', secret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  const query = buildSignData(sorted);
  return `${vnpUrl}?${query}&vnp_SecureHash=${signed}`;
}

async function check() {
  console.log('--- VNPay Package Exports ---');
  console.log(Object.keys(VNPayPackage));
  
  const tmnCode = 'TMNCODE123';
  const secret = 'SECRET123';
  const sampleParams = {
    amount: 50000,
    txnRef: 'ORD123',
    orderInfo: 'Test Payment',
    returnUrl: 'http://localhost/return',
    ipAddr: '127.0.0.1'
  };

  const manualUrl = buildVNPayUrlManual(sampleParams, tmnCode, secret);
  console.log('\nManual URL:', manualUrl);

  try {
    const VNPayClass = (VNPayPackage as any).VNPay;
    if (VNPayClass) {
      const vnpay = new VNPayClass({
        tmnCode: tmnCode,
        secureSecret: secret,
        vnpayHost: 'https://sandbox.vnpayment.vn',
      });
      const packageUrl = vnpay.buildPaymentUrl({
        vnp_Amount: sampleParams.amount,
        vnp_IpAddr: sampleParams.ipAddr,
        vnp_TxnRef: sampleParams.txnRef,
        vnp_OrderInfo: sampleParams.orderInfo,
        vnp_ReturnUrl: sampleParams.returnUrl,
        vnp_CreateDate: '20240101000000',
      });
      console.log('Package URL:', packageUrl);
    } else {
        console.log('VNPay class not found in exports.');
    }
  } catch (err: any) {
    console.log('Error using package:', err.message);
  }
}

check();
