'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, loginWithGoogle, logout as firebaseLogout, db } from '@/firebase';
import { UserProfile } from '@/types';
import { isAdmin, getAdminBadges } from '@/lib/admin';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isDarkMode: boolean;
  isAdminUser: boolean;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isDarkMode: true,
  isAdminUser: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
  toggleDarkMode: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);

  // Auth listener — single source of truth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser) {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // UserProfile listener — single listener for entire app
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        let profile = docSnap.data() as UserProfile;
        // Admin gets visual badges only — no fake coins
        if (isAdmin(user.email)) {
          profile = {
            ...profile,
            badges: Array.from(new Set([...(profile.badges || []), ...getAdminBadges()])),
          };
        }
        setUserProfile(profile);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Dark mode — read from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = saved !== 'light';
    setIsDarkMode(prefersDark);
  }, []);

  // Apply dark mode class + persist
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const login = useCallback(async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const isAdminUser = isAdmin(user?.email);

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isDarkMode,
      isAdminUser,
      loading,
      login,
      logout,
      toggleDarkMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
