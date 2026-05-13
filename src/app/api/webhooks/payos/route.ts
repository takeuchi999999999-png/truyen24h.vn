import { NextResponse } from 'next/server';
import { payos } from '@/services/payos';
import { db } from '@/firebase-backend';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Chặn vòng lặp webhook test của PayOS
    if (body?.data?.orderCode === 123) {
      return NextResponse.json({ message: "Test Webhook: OK" });
    }

    // 2. Xác thực tính toàn vẹn của Webhook (Chống giả mạo)
    // Sẽ throw error nếu signature không khớp với checksum key
    let webhookData;
    try {
      webhookData = await payos.webhooks.verify(body);
    } catch (e) {
      console.error('Lỗi mã Signature Webhook PayOS:', e);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // webhookData là dữ liệu thật của Order sau khi chuyển khoản thành công
    const orderCode = webhookData.orderCode;
    const amount = webhookData.amount;
    const description = webhookData.description; // Ví dụ: NAPXU ABCD

    console.log(`[PayOS Webhook] Nhận tiền: ${amount}VND cho Mã Đơn: ${orderCode}`);

    // Đọc thông tin Đơn Hàng trong Database để xem nó thuc về User nào
    const orderRef = doc(db, 'orders', String(orderCode));
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.error(`Không tìm thấy đơn hàng mã ${orderCode} trong Database`);
      return NextResponse.json({ message: "Order not found but acknowledged" }, { status: 200 });
    }

    const orderData = orderSnap.data();

    // Chống nạp tiền 2 lần cho cùng 1 đơn hàng
    if (orderData.status === "PAID") {
      return NextResponse.json({ message: "Order already paid" });
    }

    // Lấy User ID
    const userId = orderData.uid;
    const coinsToAdd = orderData.coins;

    // Cập nhật ví User
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      coins: increment(coinsToAdd)
    });

    // Cập nhật trạng thái Đơn hàng thành ĐÃ THANH TOÁN
    await updateDoc(orderRef, {
      status: "PAID",
      paidAt: serverTimestamp(),
      actualAmount: amount
    });

    console.log(`[PayOS Webhook] Đã cng ${coinsToAdd} Xu cho user ${userId}`);

    return NextResponse.json({ message: "Giao dịch thành công" });
  } catch (error: any) {
    console.error('[PayOS Webhook Lỗi Hệ Thống]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
