"use client";
import { useState } from 'react';
import { X, ArrowRightLeft, Wallet, Building2, UserCircle2, CreditCard } from 'lucide-react';
import { UserProfile } from '../types';

interface WithdrawModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onConfirm: (bankName: string, accountName: string, accountNumber: string) => Promise<void>;
}

export default function WithdrawModal({ userProfile, onClose, onConfirm }: WithdrawModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCoins = userProfile.coins || 0;
  const currentVND = currentCoins * 100;
  const isInsufficient = currentCoins < 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient) return;
    if (!bankName || !accountName || !accountNumber) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    
    setIsSubmitting(true);
    await onConfirm(bankName, accountName, accountNumber);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-surface rounded-[32px] shadow-2xl border border-accent/10 p-8 animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-background-light rounded-full text-muted transition-colors">
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ArrowRightLeft className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tighter">Yêu cầu rút tiền</h2>
            <p className="text-muted font-medium text-sm">Chuyển đổi Xu sang VNĐ</p>
          </div>
        </div>

        <div className={`rounded-2xl p-6 flex flex-col items-center justify-center border-2 mb-8 transition-colors ${isInsufficient ? 'bg-red-500/10 border-red-500/20' : 'bg-background-light border-primary/20'}`}>
          <p className="text-xs font-black text-muted uppercase tracking-widest mb-2">Số dư hiện tại của bạn</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className={`font-display text-4xl font-black ${isInsufficient ? 'text-red-500' : 'text-primary'}`}>{currentCoins.toLocaleString()}</span>
            <span className="font-bold text-muted">Xu</span>
          </div>
          <div className="flex items-center gap-2 text-text-main font-bold mb-4">
            <Wallet className="size-4 opacity-50" />
            <span>~ {currentVND.toLocaleString()} VNĐ</span>
          </div>
          {isInsufficient && (
            <div className="text-center bg-surface px-4 py-3 rounded-xl border border-red-500/20 w-full">
              <p className="text-red-500 text-xs font-black uppercase tracking-widest">⚠️ Tối thiểu cần 500 Xu (50.000đ) để rút tiền!</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-2 block">Tên Ngân Hàng (VD: Vietcombank, Momo...)</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted" />
              <input 
                type="text" required value={bankName} onChange={e => setBankName(e.target.value)}
                placeholder="Nhập tên ngân hàng hoặc ví điện tử" disabled={isInsufficient}
                className="w-full h-12 pl-14 pr-6 bg-background-light rounded-xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-2 block">Tên Chủ Tài Khoản</label>
            <div className="relative">
              <UserCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted" />
              <input 
                type="text" required value={accountName} onChange={e => setAccountName(e.target.value.toUpperCase())}
                placeholder="VIET HOA KHONG DAU" disabled={isInsufficient}
                className="w-full h-12 pl-14 pr-6 bg-background-light rounded-xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/50 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-muted mb-2 block">Số Tài Khoản</label>
            <div className="relative">
              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted" />
              <input 
                type="text" required value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/[^0-9Aa-z]/g, ''))}
                placeholder="Nhập số tài khoản ngân hàng" disabled={isInsufficient}
                className="w-full h-12 pl-14 pr-6 bg-background-light rounded-xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || isInsufficient}
            className="w-full h-14 mt-4 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all disabled:bg-background-light disabled:text-muted disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : (isInsufficient ? 'Chưa đủ mốc rút' : 'Gửi yêu cầu')}
          </button>
        </form>
      </div>
    </div>
  );
}
