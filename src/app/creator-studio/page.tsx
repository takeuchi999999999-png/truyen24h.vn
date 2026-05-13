"use client";

import TopNavBarClientWrapper from '@/components/TopNavBarClientWrapper';
import CreatorStudioView from '@/components/CreatorStudioView';
import { useState, useEffect } from 'react';
import { auth, loginWithGoogle } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function CreatorStudioPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <>
      <TopNavBarClientWrapper />
      <CreatorStudioView user={user} onLogin={loginWithGoogle} />
    </>
  );
}
