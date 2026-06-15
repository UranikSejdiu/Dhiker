import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, increment as fsIncrement
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Dhikr {
  id: string;
  userId: string;
  name: string;
  totalCount: number;
  dailyCount: number;
  dailyLimit: number | null;
  lastResetDate: string;
  createdAt: string;
}

interface DhikrContextType {
  dhikrs: Dhikr[];
  selectedDhikr: Dhikr | null;
  loading: boolean;
  selectDhikr: (id: string | null) => void;
  addDhikr: (name: string, dailyLimit?: number | null) => Promise<void>;
  deleteDhikr: (id: string) => Promise<void>;
  updateDhikr: (id: string, name: string, limit: number | null) => Promise<void>;
  increment: (id: string) => Promise<boolean>;
  decrement: (id: string) => Promise<void>;
  resetDaily: (id: string) => Promise<void>;
}

const DhikrContext = createContext<DhikrContextType | undefined>(undefined);

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function DhikrProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dhikrs, setDhikrs] = useState<Dhikr[]>([]);
  const [selectedDhikrId, setSelectedDhikrId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reference for batched syncing
  const pendingIncrementsRef = useRef<Record<string, { delta: number, timeout: NodeJS.Timeout | null }>>({});

  const syncPending = useCallback(async (id: string) => {
    const pending = pendingIncrementsRef.current[id];
    if (!pending || pending.delta === 0 || !user) return;

    const deltaToSync = pending.delta;
    pending.delta = 0; // Reset early to avoid double syncing if tapped again quickly

    try {
      await updateDoc(doc(db, 'users', user.uid, 'dhikrs', id), {
        totalCount: fsIncrement(deltaToSync),
        dailyCount: fsIncrement(deltaToSync),
        lastResetDate: getTodayDate(),
      });
    } catch (e) {
      console.error('Failed to sync batch:', e);
      // If network fails, restore delta so it can be retried later
      if (pendingIncrementsRef.current[id]) {
        pendingIncrementsRef.current[id].delta += deltaToSync;
      }
    }
  }, [user]);

  const scheduleSync = useCallback((id: string) => {
    const pending = pendingIncrementsRef.current[id];
    if (pending && pending.timeout) {
      clearTimeout(pending.timeout);
    }
    
    if (!pendingIncrementsRef.current[id]) {
      pendingIncrementsRef.current[id] = { delta: 0, timeout: null };
    }
    
    pendingIncrementsRef.current[id].timeout = setTimeout(() => {
      syncPending(id);
    }, 2000); // 2 second debounce
  }, [syncPending]);

  // Subscribe to user's dhikrs collection
  useEffect(() => {
    if (!user) {
      setDhikrs([]);
      setSelectedDhikrId(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'dhikrs'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const today = getTodayDate();
      const items: Dhikr[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        
        // Add any unsaved local taps to the server count to prevent rubber-banding
        const pendingDelta = pendingIncrementsRef.current[docSnap.id]?.delta || 0;

        const dhikr: Dhikr = {
          id: docSnap.id,
          userId: data.userId,
          name: data.name,
          totalCount: (data.totalCount || 0) + pendingDelta,
          dailyCount: (data.lastResetDate === today ? (data.dailyCount || 0) : 0) + pendingDelta,
          dailyLimit: data.dailyLimit ?? null,
          lastResetDate: data.lastResetDate || today,
          createdAt: data.createdAt,
        };
        
        // If day changed, update Firestore
        if (data.lastResetDate !== today) {
          updateDoc(doc(db, 'users', user.uid, 'dhikrs', docSnap.id), {
            dailyCount: 0,
            lastResetDate: today,
          });
        }
        return dhikr;
      });
      setDhikrs(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const selectedDhikr = dhikrs.find((d) => d.id === selectedDhikrId) || null;

  const selectDhikr = useCallback((id: string | null) => {
    setSelectedDhikrId(id);
  }, []);

  const addDhikr = useCallback(async (name: string, dailyLimit?: number | null) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'dhikrs'), {
      userId: user.uid,
      name,
      totalCount: 0,
      dailyCount: 0,
      dailyLimit: dailyLimit ?? null,
      lastResetDate: getTodayDate(),
      createdAt: new Date().toISOString(),
    });
  }, [user]);

  const deleteDhikr = useCallback(async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'dhikrs', id));
    if (selectedDhikrId === id) setSelectedDhikrId(null);
  }, [user, selectedDhikrId]);

  const updateDhikr = useCallback(async (id: string, name: string, limit: number | null) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'dhikrs', id), {
      name,
      dailyLimit: limit,
    });
  }, [user]);

  const increment = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    const dhikr = dhikrs.find((d) => d.id === id);
    if (!dhikr) return false;

    // Check daily limit against current state (which includes pending)
    if (dhikr.dailyLimit !== null && dhikr.dailyCount >= dhikr.dailyLimit) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return false; // Limit reached
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Track pending locally
    if (!pendingIncrementsRef.current[id]) {
      pendingIncrementsRef.current[id] = { delta: 0, timeout: null };
    }
    pendingIncrementsRef.current[id].delta += 1;

    // Optimistically update React State for instant UI feedback
    setDhikrs(current => current.map(d => {
      if (d.id === id) {
        return { ...d, dailyCount: d.dailyCount + 1, totalCount: d.totalCount + 1 };
      }
      return d;
    }));

    scheduleSync(id);
    return true;
  }, [user, dhikrs, scheduleSync]);

  const decrement = useCallback(async (id: string) => {
    if (!user) return;
    const dhikr = dhikrs.find((d) => d.id === id);
    if (!dhikr || dhikr.dailyCount <= 0) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!pendingIncrementsRef.current[id]) {
      pendingIncrementsRef.current[id] = { delta: 0, timeout: null };
    }
    pendingIncrementsRef.current[id].delta -= 1;

    setDhikrs(current => current.map(d => {
      if (d.id === id) {
        return { ...d, dailyCount: Math.max(0, d.dailyCount - 1), totalCount: Math.max(0, d.totalCount - 1) };
      }
      return d;
    }));

    scheduleSync(id);
  }, [user, dhikrs, scheduleSync]);

  const resetDaily = useCallback(async (id: string) => {
    if (!user) return;
    
    // Clear any pending syncs so they don't overwrite our reset
    if (pendingIncrementsRef.current[id]) {
      if (pendingIncrementsRef.current[id].timeout) {
        clearTimeout(pendingIncrementsRef.current[id].timeout!);
      }
      pendingIncrementsRef.current[id].delta = 0;
    }

    await updateDoc(doc(db, 'users', user.uid, 'dhikrs', id), {
      dailyCount: 0,
      lastResetDate: getTodayDate(),
    });
  }, [user]);

  return (
    <DhikrContext.Provider
      value={{
        dhikrs,
        selectedDhikr,
        loading,
        selectDhikr,
        addDhikr,
        deleteDhikr,
        updateDhikr,
        increment,
        decrement,
        resetDaily,
      }}
    >
      {children}
    </DhikrContext.Provider>
  );
}

export function useDhikr() {
  const ctx = useContext(DhikrContext);
  if (!ctx) throw new Error('useDhikr must be used within DhikrProvider');
  return ctx;
}
