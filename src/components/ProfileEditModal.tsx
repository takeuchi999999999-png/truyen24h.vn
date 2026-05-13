"use client";
import React, { useState } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { X, Camera, Save, Loader2, Zap, Coins, Crown, Gift } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { useEffect } from 'react';

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditModal({ user, onClose, onUpdate }: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleRecharge = async () => {
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, path), {
        coins: increment(1000)
      });
      alert('Đã nạp thành công 1000 Ngọc! (Bản thử nghiệm)');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpgradeVIP = async () => {
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, path), {
        isVip: true,
        badges: ['VIP', 'Fan Cứng']
      });
      alert('Chúc mừng! Bạn đã trở thành thành viên VIP. (Bản thử nghiệm)');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Đã có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-background-light rounded-full text-muted transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-black text-text-main uppercase tracking-tighter mb-2">Hồ sơ cá nhân</h2>
          <p className="text-sm text-muted font-medium">Quản lý thông tin và tài sản của bạn</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-background-light rounded-3xl p-4 border border-accent/5 flex flex-col items-center text-center">
            <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-2">
              <Zap className="size-5" />
            </div>
            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Cấp độ</span>
            <span className="text-xl font-black text-text-main">{userProfile?.level || 1}</span>
            <div className="w-full h-1 bg-accent/20 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${(userProfile?.exp || 0) % 100}%` }}></div>
            </div>
          </div>
          <div className="bg-background-light rounded-3xl p-4 border border-accent/5 flex flex-col items-center text-center">
            <div className="size-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600 mb-2">
              <Coins className="size-5" />
            </div>
            <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Số dư Ngọc</span>
            <span className="text-xl font-black text-text-main">{userProfile?.coins || 0}</span>
            <button 
              onClick={handleRecharge}
              className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 hover:underline"
            >
              Nạp thêm
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="size-32 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                <img 
                  src={photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}`} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                <Camera className="size-8 text-white" />
              </div>
            </div>
            
            <div className="w-full">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-3 block">Link ảnh đại diện</label>
              <input 
                type="url" 
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted mb-3 block">Tên hiển thị</label>
            <input 
              type="text" 
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nhập tên của bạn"
              className="w-full h-14 px-6 bg-background-light rounded-2xl border-none outline-none font-bold text-text-main focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-bold text-center">{error}</p>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={handleUpgradeVIP}
              className="flex-1 h-14 bg-background-dark text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Crown className="size-4 text-yellow-400" />
              Nâng cấp VIP
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="flex-1 h-14 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
