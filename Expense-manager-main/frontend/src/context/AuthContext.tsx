'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setUserFromToken: (t: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setUserFromToken = useCallback(async (t: string) => {
    localStorage.setItem('token', t);
    setToken(t);
    const { user: u } = await authApi.me();
    setUser(u);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      setLoading(false);
      return;
    }
    setToken(t);
    authApi.me()
      .then(({ user: u }) => setUser(u))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await authApi.login({ email, password });
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { token: t, user: u } = await authApi.register({ email, password, name });
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUserFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
