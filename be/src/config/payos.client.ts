import { PayOS } from '@payos/node';

const clientID = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

if (!clientID || !apiKey || !checksumKey) {
  console.warn('⚠️ PayOS environment variables (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY) are not fully configured.');
}

export const payOS = new PayOS({
  clientId: clientID || '',
  apiKey: apiKey || '',
  checksumKey: checksumKey || ''
});
