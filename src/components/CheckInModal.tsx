"use client";
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Sparkles, Calendar, Gift, X, CheckCircle2, Loader2 } from 'lucide-react';
import { getDailyGreeting } from '../services/geminiService';

interface CheckInModalProps {
  user: User;
  onClose: () => void;
}

export default function CheckInModal({ user, onClose }: CheckInModalProps) {
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [reward, setReward] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHasCheckedInToday(userData.lastCheckIn === today);
        }
        
        const aiGreeting = await getDailyGreeting(user.displayName || 'Bạn');
        setGreeting(aiGreeting);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user, today]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const rewardAmount = 10; // Fixed reward for now
    const path = `users/${user.uid}`;
    
    try {
      // Update user document
      await updateDoc(doc(db, path), {
        coins: increment(rewardAmount),
        lastCheckIn: today,
        updatedAt: serverTimestamp()
      });

      // Log check-in
      await setDoc(doc(db, `${path}/checkins/${today}`), {
        userId: user.uid,
        date: today,
        reward: rewardAmount,
        createdAt: serverTimestamp()
      });

      setReward(rewardAmount);
      setHasCheckedInToday(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Loader2 className="size-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-surface rounded-[40px] shadow-2xl border border-accent/10 p-10 animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-background-light rounded-full text-muted transition-colors z-10"
        >
          <X className="size-5" />
        </button>

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center ring-8 ring-primary/5">
              <Sparkles className="size-12 text-primary animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-black text-text-main uppercase tracking-tighter mb-4">Điểm danh hàng ngày</h2>
            <p className="text-sm text-muted font-medium italic">"{greeting}"</p>
          </div>

          <div className="bg-background-light rounded-3xl p-8 mb-10 border border-accent/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-primary" />
                <span className="font-bold text-sm text-text-main">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                +10 Xu
              </div>
            </div>

            {hasCheckedInToday ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle2 className="size-12 text-green-500" />
                <div className="text-center">
                  <p className="font-black text-text-main uppercase tracking-widest text-sm">Đã điểm danh!</p>
                  <p className="text-xs text-muted mt-1">Hẹn gặp lại bạn vào ngày mai nhé.</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full h-16 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {checkingIn ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Gift className="size-5" />
                    Nhận quà ngay
                  </>
                )}
              </button>
            )}
          </div>

          {reward > 0 && (
            <div className="text-center animate-bounce mb-6">
              <p className="text-primary font-black text-lg">Chúc mừng! Bạn nhận được {reward} Xu 🪙</p>
            </div>
          )}

          <p className="text-[10px] text-center text-muted uppercase tracking-[0.2em] font-bold mb-6">
            Tích lũy xu để mở khóa các tính năng đặc biệt
          </p>

          {hasCheckedInToday && (
            <button 
              onClick={onClose}
              className="w-full h-12 bg-background-light text-text-main border border-accent/10 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-accent/5 transition-all"
            >
              Tuyệt vời, Đóng lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
