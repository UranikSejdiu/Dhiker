import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiRequest, getApiUrl } from '../config/api';

export interface AppUser {
  id: string;
  email: string;
  display_name: string;
  session_token: string;
  theme?: string;
  language?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
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
          const parsed = JSON.parse(sessionJson);
          // Only set user if it has email/displayName (fully populated)
          if (parsed && parsed.email) {
            setUser(parsed);
          }
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
    if (Platform.OS === 'web') {
      // Direct redirect on web
      window.location.href = getApiUrl('google_login');
    } else {
      throw new Error('Google Sign-In is only supported on Web in this self-hosted version.');
    }
  };

  const loginWithToken = async (token: string) => {
    try {
      setLoading(true);
      // Save temp token first so apiRequest uses it in the Auth header
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify({ session_token: token }));
      
      const data = await apiRequest('get_profile', 'POST');
      if (data.user) {
        await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
        setUser(data.user);
      } else {
        throw new Error('Failed to retrieve user profile.');
      }
    } catch (err) {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
