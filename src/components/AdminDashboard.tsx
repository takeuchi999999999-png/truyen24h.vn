"use client";
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ShieldCheck, CheckCircle2, Clock, Wallet, Search, Loader2 } from 'lucide-react';

interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountXu: number;
  amountVND: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  status: 'PENDING' | 'COMPLETED';
  createdAt: any;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'withdraw_requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawRequest[];
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAsCompleted = async (reqId: string) => {
    if (!window.confirm("Xác nhận đã chuyển khoản cho tác giả này?")) return;
    try {
      await updateDoc(doc(db, 'withdraw_requests', reqId), {
        status: 'COMPLETED'
      });
      alert('Đã duyệt lệnh rút tiền!');
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật trạng thái.');
    }
  };

  const filteredRequests = requests.filter(req => 
    req.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.accountNumber || '').includes(searchTerm)
  );

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="size-16 rounded-3xl bg-primary/20 text-primary flex items-center justify-center shadow-lg border border-primary/20">
          <ShieldCheck className="size-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text-main uppercase tracking-tighter">Hệ Thống Quản Trị</h1>
          <p className="text-muted font-medium">Bảng điều khiển dành riêng cho Admin Truyen24h.vn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface p-6 rounded-[32px] border border-accent/10 shadow-xl flex items-center gap-6">
          <div className="size-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Clock className="size-6" />
          </div>
          <div>
            <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">Chờ Duyệt Rút Tiền</p>
            <p className="text-4xl font-black text-text-main">{pendingCount}</p>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-[32px] border border-accent/10 shadow-xl flex items-center gap-6">
          <div className="size-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">Đã Hoàn Thành</p>
            <p className="text-4xl font-black text-text-main">{requests.length - pendingCount}</p>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-[32px] border border-accent/10 shadow-xl flex items-center gap-6">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-xs font-black text-muted uppercase tracking-widest mb-1">Tổng Lệnh Lịch Sử</p>
            <p className="text-4xl font-black text-text-main">{requests.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-[40px] border border-accent/10 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-accent/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-text-main uppercase tracking-widest">Danh sách Yêu cầu Rút tiền</h2>
            <p className="text-sm text-muted">Xử lý các yêu cầu chuyển đổi doanh thu của tác giả.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted" />
            <input 
              type="text" 
              placeholder="Tìm tên, email, STK..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-6 bg-background-light rounded-full border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-background-light text-[10px] uppercase tracking-widest text-muted border-b border-accent/10">
                <th className="px-6 py-4 font-black">Thời gian</th>
                <th className="px-6 py-4 font-black">Tác giả</th>
                <th className="px-6 py-4 font-black text-right">Số VĐN / Xu</th>
                <th className="px-6 py-4 font-black text-center">Ngân hàng</th>
                <th className="px-6 py-4 font-black">STK & CTK</th>
                <th className="px-6 py-4 font-black text-center">Trạng thái</th>
                <th className="px-6 py-4 font-black text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent/5">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-muted">
                      {req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString('vi-VN') : 'Mới tạo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-text-main">{req.userName}</p>
                    <p className="text-[10px] text-muted">{req.userEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-lg font-black text-primary tracking-tighter">{req.amountVND.toLocaleString()} đ</p>
                    <p className="text-[10px] font-bold text-muted">{req.amountXu.toLocaleString()} Xu</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-background-light rounded-lg text-xs font-bold text-text-main">
                      {req.bankName || 'Chưa cập nhật'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-base font-black text-text-main tracking-widest">{req.accountNumber || '?'}</p>
                    <p className="text-xs font-bold text-muted uppercase">{req.accountName || 'CHƯA CẬP NHẬT'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                        <CheckCircle2 className="size-3" /> Đã duyệt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
                        <Clock className="size-3" /> Chờ xử lý
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {req.status === 'PENDING' && (
                      <button 
                        onClick={() => handleMarkAsCompleted(req.id)}
                        className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all opacity-0 group-hover:opacity-100"
                      >
                        Đã chuyển
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-muted font-bold text-sm">
                    Không có dữ liệu yêu cầu rút tiền nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
