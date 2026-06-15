import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../config/api';

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  session_token: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_SESSION_KEY = '@my_dhikr_user_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user session on startup
    const restoreSession = async () => {
      try {
        const sessionJson = await AsyncStorage.getItem(USER_SESSION_KEY);
        if (sessionJson) {
          setUser(JSON.parse(sessionJson));
        }
      } catch (err) {
        console.warn('Failed to restore user session:', err);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest('login', 'POST', { email, password });
    if (data.user) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } else {
      throw new Error('Invalid login response from server.');
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await apiRequest('register', 'POST', { email, password, displayName });
    if (data.user) {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } else {
      throw new Error('Invalid registration response from server.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    } catch (err) {
      console.warn('Failed to remove session key:', err);
    }
    setUser(null);
  };

  const loginWithGoogle = async () => {
    throw new Error('Google Sign-In is not supported in self-hosted mode.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
