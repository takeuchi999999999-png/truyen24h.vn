import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { MessageSquare, Send, User as UserIcon, Star, Quote } from 'lucide-react';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  rating: number;
  title?: string;
  createdAt: Timestamp;
}

interface CommentSectionProps {
  novelId: string;
  user: User | null;
  onLogin: () => void;
}

export default function CommentSection({ novelId, user, onLogin }: CommentSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    const path = `novels/${novelId}/reviews`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
      setReviews(fetchedReviews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [novelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onLogin();
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const path = `novels/${novelId}/reviews`;
    try {
      await addDoc(collection(db, path), {
        novelId,
        userId: user.uid,
        userName: user.displayName || 'Ẩn danh',
        userPhoto: user.photoURL || '',
        content: newComment.trim(),
        rating,
        title: title.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setTitle('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Star className="size-5 fill-primary" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest">Đánh giá & Nhận xét ({reviews.length})</h3>
        </div>
        
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-full border border-accent/10">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-black text-sm">
              {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="bg-surface rounded-[32px] p-8 border border-accent/10 shadow-xl mb-12 relative overflow-hidden group">
        <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Quote className="size-32 text-primary" />
        </div>
        
        {user ? (
          <form onSubmit={handleSubmit} className="relative z-10">
            <div className="flex flex-col md:flex-row gap-8 mb-6">
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="size-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star 
                        className={`size-5 transition-colors ${
                          star <= (hoveredRating || rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-accent/30'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tiêu đề đánh giá (không bắt buộc)"
                  className="w-full bg-background-light rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về bộ truyện này..."
                  className="w-full bg-background-light rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-30 transition-all group/btn"
              >
                <span>Gửi đánh giá</span>
                <Send className="size-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="size-16 bg-background-light rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="size-8 text-muted" />
            </div>
            <h4 className="text-lg font-black text-text-main mb-2">Bạn muốn viết đánh giá?</h4>
            <p className="text-muted text-sm mb-8">Vui lòng đăng nhập để chia sẻ cảm nhận của bạn với cộng đồng.</p>
            <button
              onClick={onLogin}
              className="px-12 py-4 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all"
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </div>

      {/* Review List */}
      <div className="space-y-8">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="flex gap-6 group animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="shrink-0">
                <div className="size-14 rounded-2xl overflow-hidden border border-accent/10 shadow-md group-hover:border-primary/30 transition-all">
                  <img 
                    src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-surface rounded-[32px] p-8 border border-accent/10 shadow-sm group-hover:shadow-xl group-hover:border-primary/10 transition-all relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-base text-text-main">{review.userName}</span>
                        <div className="flex gap-0.5 ml-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`size-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-accent/20'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                        {review.createdAt?.toDate().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h5 className="text-lg font-black text-text-main mb-3 tracking-tight">{review.title}</h5>
                  )}
                  <p className="text-text-main/80 leading-relaxed font-medium">{review.content}</p>
                  
                  <div className="absolute top-8 right-8 opacity-5">
                    <Quote className="size-12 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-background-light rounded-[40px] border-2 border-dashed border-accent/10">
            <div className="size-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <MessageSquare className="size-10 text-accent/30" />
            </div>
            <h4 className="text-xl font-black text-text-main mb-2">Chưa có đánh giá nào</h4>
            <p className="text-muted font-medium">Hãy là người đầu tiên viết bài review có tâm cho bộ truyện này!</p>
          </div>
        )}
      </div>
    </div>
  );
}
