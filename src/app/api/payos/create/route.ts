import { NextResponse } from 'next/server';
import { payos } from '@/services/payos';
import { getSiteUrl } from '@/lib/site';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderCode, amount, description, cancelUrl, returnUrl } = body;

    if (!orderCode || !amount) {
      return NextResponse.json({ error: 'Missing orderCode or amount' }, { status: 400 });
    }

    // Build absolute return/cancel URLs from the configured site origin so
    // PayOS always redirects users back to the live deployment, not localhost.
    const siteUrl = getSiteUrl();
    const defaultReturnUrl = `${siteUrl}/vip?payment=success`;
    const defaultCancelUrl = `${siteUrl}/vip?payment=cancelled`;

    const payload = {
      orderCode: orderCode, // Unique integer <= 9007199254740991
      amount: amount,
      description: description || 'Nap Xu WebTruyen',
      cancelUrl: cancelUrl || defaultCancelUrl,
      returnUrl: returnUrl || defaultReturnUrl,
    };

    const paymentLinkRes = await payos.paymentRequests.create(payload);

    return NextResponse.json(paymentLinkRes);
  } catch (error: any) {
    console.error('Lỗi tạo link PayOS:', error);
    return NextResponse.json({ error: error.message || 'Lỗi kết nối PayOS' }, { status: 500 });
  }
}
