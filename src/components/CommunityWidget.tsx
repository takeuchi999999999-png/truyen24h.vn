"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Users, Sparkles, Hash, ChevronRight } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const CHANNELS = [
  { id: 'general', name: 'Thảo luận chung', icon: MessageCircle },
  { id: 'request', name: 'Xin truyện', icon: Hash },
  { id: 'spoil', name: 'Khu Spoil', icon: Sparkles },
];

export default function CommunityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch messages for the active channel
    const q = query(
      collection(db, `channels/${activeChannel}/messages`),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [isOpen, activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    // Use current admin profile if it is the admin testing email.
    // In production we would fetch the user's role from their firestore doc.
    const isVIP = user.email === 'phamanhtung.jp@gmail.com';

    await addDoc(collection(db, `channels/${activeChannel}/messages`), {
      text: message.trim(),
      uid: user.uid,
      displayName: user.displayName || 'Vô danh',
      photoURL: user.photoURL,
      isVIP: isVIP,
      timestamp: serverTimestamp()
    });

    setMessage('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 size-16 sm:size-14 bg-background-light p-1 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center border-2 border-primary/50 hover:border-primary hover:scale-110 transition-all z-50 ${isOpen ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100'}`}
      >
        <img src="/logo.jpg" alt="Cộng Đồng" className="w-full h-full object-cover rounded-full" />
        <div className="absolute top-0 right-0 size-4 bg-red-500 rounded-full border-2 border-background animate-pulse"></div>
      </button>

      {/* Slide-out Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-surface shadow-2xl z-[100] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col border-l border-accent/10 ${isOpen ? 'translate-x-0' : 'translate-x-[110%]'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-background-light">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
               <Users className="size-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-text-main leading-tight shrink-0">Cộng Đồng</h3>
              <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                994+ Online
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 bg-background-light rounded-full text-muted hover:text-text-main transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Channels List (Horizontal Scroll) */}
        <div className="flex px-4 py-3 gap-2 overflow-x-auto border-b border-background-light no-scrollbar shrink-0">
          {CHANNELS.map(c => (
             <button
               key={c.id}
               onClick={() => setActiveChannel(c.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeChannel === c.id ? 'bg-primary text-white shadow-md' : 'bg-background-light text-muted hover:text-text-main'}`}
             >
                <c.icon className="size-3.5" />
                {c.name}
             </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-background-light/50">
          <div className="text-center pb-4 text-xs text-muted font-medium border-b border-accent/5">
             Chào mừng bạn đến với kênh {CHANNELS.find(c => c.id === activeChannel)?.name}
          </div>

          {messages.map((msg) => {
            const isMe = user && msg.uid === user.uid;
            
            return (
              <div key={msg.id} className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                 <div className="size-8 shrink-0 rounded-full overflow-hidden border border-accent/20 bg-background-light mt-1">
                    <img src={msg.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.displayName}`} alt="avatar" className="w-full h-full object-cover" />
                 </div>
                 <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2">
                       <span className="text-[11px] font-bold text-muted">{msg.displayName}</span>
                       {msg.isVIP && (
                          <span className="text-[9px] bg-yellow-500 text-white px-1.5 rounded uppercase font-black tracking-widest shadow-sm">VIP</span>
                       )}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-surface text-text-main rounded-tl-none border border-accent/5'}`}>
                       {msg.text}
                    </div>
                 </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-background-light bg-surface shrink-0">
          {user ? (
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Chat trong #${CHANNELS.find(c => c.id === activeChannel)?.name}...`}
                className="w-full bg-background-light border border-accent/20 rounded-full pl-5 pr-14 py-3 text-sm text-text-main outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className="absolute right-2 p-2 bg-primary text-white rounded-full disabled:opacity-50 hover:bg-primary/90 transition-all"
              >
                <Send className="size-4 -ml-0.5 mt-0.5" />
              </button>
            </form>
          ) : (
            <div className="w-full py-4 text-center bg-background-light rounded-xl border border-dashed border-accent/20">
              <p className="text-sm font-bold text-muted">Vui lòng đăng nhập để chat.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] sm:hidden"
        />
      )}
    </>
  );
}
