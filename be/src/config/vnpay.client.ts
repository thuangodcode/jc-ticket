import crypto from 'crypto';

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key] ?? '';
      return sorted;
    }, {} as Record<string, string>);
}

function buildCanonicalQuery(obj: Record<string, string>): string {
  return Object.keys(obj)
    .sort()
    .filter(key => {
      const value = obj[key] ?? '';
      return value !== '';
    })
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key] ?? '')}`)
    .join('&');
}

export function buildVnpaySignatureData(obj: Record<string, string>): string {
  return buildCanonicalQuery(obj);
}

export function verifyVnpaySignature(query: Record<string, string>): {
  isVerified: boolean;
  isSuccess: boolean;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_Amount: number;
  vnp_TransactionNo: string;
} {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = query;
  const signData = buildCanonicalQuery(rest as Record<string, string>);
  const secret = process.env.VNP_HASHSECRET?.trim() || '';
  const calculatedHash = crypto
    .createHmac('sha256', secret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return {
    isVerified: calculatedHash === vnp_SecureHash,
    isSuccess: String(rest.vnp_ResponseCode ?? '') === '00',
    vnp_ResponseCode: String(rest.vnp_ResponseCode ?? ''),
    vnp_TransactionStatus: String(rest.vnp_TransactionStatus ?? ''),
    vnp_TxnRef: String(rest.vnp_TxnRef ?? ''),
    vnp_Amount: Math.round(Number(rest.vnp_Amount ?? 0) / 100),
    vnp_TransactionNo: String(rest.vnp_TransactionNo ?? ''),
  };
}

export function buildVNPayUrl(params: {
  amount: number;       // VND thực, ví dụ 500000
  txnRef: string;
  orderInfo: string;
  returnUrl: string;
  ipAddr: string;
  locale?: string;
}): string {
  const tmnCode = process.env.VNP_TMNCODE?.trim();
  const secret = process.env.VNP_HASHSECRET?.trim();
  const vnpUrl = process.env.VNP_URL?.trim() || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  if (!tmnCode || !secret) {
    throw new Error('Missing VNPay configuration: VNP_TMNCODE or VNP_HASHSECRET');
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const createDate =
    `${now.getFullYear()}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}` +
    `${pad(now.getSeconds())}`;

  const rawParams: Record<string, string> = sortObject({
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
  });

  const signData = buildCanonicalQuery(rawParams);
  const signed = crypto.createHmac('sha256', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
  const query = `${buildCanonicalQuery(rawParams)}&vnp_SecureHash=${signed}&vnp_SecureHashType=SHA256`;

  console.log('🔍 signData:', signData);
  console.log('🔍 hash:', signed);

  console.log('💳 [VNPay] Payment URL:', `${vnpUrl}?${query}`);
  return `${vnpUrl}?${query}`;
}

export function getVnpReturnUrl(): string {
  return process.env.VNP_RETURNURL?.trim() ||
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/result`;
}