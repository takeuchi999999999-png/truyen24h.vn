import { PayOS } from '@payos/node';

export const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || 'NOT_FOUND',
  apiKey: process.env.PAYOS_API_KEY || 'NOT_FOUND',
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'NOT_FOUND'
});
