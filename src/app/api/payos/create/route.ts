import { NextResponse } from 'next/server';
import { payos } from '@/services/payos';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderCode, amount, description, cancelUrl, returnUrl } = body;

    if (!orderCode || !amount) {
      return NextResponse.json({ error: 'Missing orderCode or amount' }, { status: 400 });
    }

    const payload = {
      orderCode: orderCode, // Unique integer <= 9007199254740991
      amount: amount,
      description: description || 'Nap Xu WebTruyen',
      cancelUrl: cancelUrl || 'http://localhost:3005',
      returnUrl: returnUrl || 'http://localhost:3005',
    };

    const paymentLinkRes = await payos.paymentRequests.create(payload);

    return NextResponse.json(paymentLinkRes);
  } catch (error: any) {
    console.error('Lỗi tạo link PayOS:', error);
    return NextResponse.json({ error: error.message || 'Lỗi kết nối PayOS' }, { status: 500 });
  }
}
