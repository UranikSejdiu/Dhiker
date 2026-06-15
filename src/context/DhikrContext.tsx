import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Dhikr {
  id: string;
  user_id: string;
  name: string;
  total_count: number;
  daily_count: number;
  daily_limit: number | null;
  last_reset_date: string;
  created_at: string;
}

// Map db fields to camelCase for the frontend UI compatibility
export interface UIDhikr {
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
  dhikrs: UIDhikr[];
  selectedDhikr: UIDhikr | null;
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

function toUIDhikr(dbDhikr: Dhikr, pendingDelta: number = 0): UIDhikr {
  const today = getTodayDate();
  const dayChanged = dbDhikr.last_reset_date !== today;
  
  return {
    id: dbDhikr.id,
    userId: dbDhikr.user_id,
    name: dbDhikr.name,
    totalCount: dbDhikr.total_count + pendingDelta,
    dailyCount: (dayChanged ? 0 : dbDhikr.daily_count) + pendingDelta,
    dailyLimit: dbDhikr.daily_limit,
    lastResetDate: dayChanged ? today : dbDhikr.last_reset_date,
    createdAt: dbDhikr.created_at,
  };
}

export function DhikrProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [dhikrs, setDhikrs] = useState<UIDhikr[]>([]);
  const [selectedDhikrId, setSelectedDhikrId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reference for batched syncing
  const pendingIncrementsRef = useRef<Record<string, { delta: number, timeout: NodeJS.Timeout | null }>>({});

  const fetchDhikrs = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('dhikrs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dhikrs:', error);
      return;
    }

    const today = getTodayDate();
    const items = data.map((d: Dhikr) => {
      // Auto-reset daily count if day changed
      if (d.last_reset_date !== today) {
        supabase.from('dhikrs').update({
          daily_count: 0,
          last_reset_date: today
        }).eq('id', d.id).then();
      }
      return toUIDhikr(d, pendingIncrementsRef.current[d.id]?.delta || 0);
    });

    setDhikrs(items);
    setLoading(false);
  }, [user]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    if (!user) {
      setDhikrs([]);
      setSelectedDhikrId(null);
      setLoading(false);
      return;
    }

    fetchDhikrs();

    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dhikrs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Re-fetch everything on change for simplicity, or handle payload manually
          // Since we do optimistic updates, we rely on state updates locally mostly,
          // but we fetch to catch multi-device sync
          fetchDhikrs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDhikrs]);

  const syncPending = useCallback(async (id: string) => {
    const pending = pendingIncrementsRef.current[id];
    if (!pending || pending.delta === 0 || !user) return;

    const deltaToSync = pending.delta;
    pending.delta = 0;

    try {
      // Use RPC (stored procedure) for atomic increment/decrement in Postgres,
      // OR we can just do a naive update if we aren't heavily concurrent
      // Supabase has no direct "fsIncrement", so we fetch current and add.
      // A better way is using a Postgres function, but for now we'll rely on local state tracking.
      
      const { data, error } = await supabase
        .from('dhikrs')
        .select('total_count, daily_count, last_reset_date')
        .eq('id', id)
        .single();
        
      if (!error && data) {
        const today = getTodayDate();
        const dayChanged = data.last_reset_date !== today;
        const newDaily = (dayChanged ? 0 : data.daily_count) + deltaToSync;
        const newTotal = data.total_count + deltaToSync;

        await supabase.from('dhikrs').update({
          total_count: newTotal,
          daily_count: newDaily,
          last_reset_date: today
        }).eq('id', id);
      }
    } catch (e) {
      console.error('Failed to sync batch:', e);
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
    }, 2000); // 2s debounce
  }, [syncPending]);

  const selectedDhikr = dhikrs.find((d) => d.id === selectedDhikrId) || null;

  const selectDhikr = useCallback((id: string | null) => {
    setSelectedDhikrId(id);
  }, []);

  const addDhikr = useCallback(async (name: string, dailyLimit?: number | null) => {
    if (!user) return;
    
    // Optimistic UI update
    const tempId = 'temp-' + Date.now();
    const tempDhikr: UIDhikr = {
      id: tempId,
      userId: user.id,
      name,
      totalCount: 0,
      dailyCount: 0,
      dailyLimit: dailyLimit ?? null,
      lastResetDate: getTodayDate(),
      createdAt: new Date().toISOString()
    };
    setDhikrs(curr => [tempDhikr, ...curr]);

    const { error } = await supabase.from('dhikrs').insert({
      user_id: user.id,
      name,
      total_count: 0,
      daily_count: 0,
      daily_limit: dailyLimit ?? null,
      last_reset_date: getTodayDate(),
    });
    
    if (error) {
      // Revert optimistic update
      setDhikrs(curr => curr.filter(d => d.id !== tempId));
      throw error;
    }
    
    // Realtime will fetch the real ID, but we can call fetch directly to be safe
    fetchDhikrs();
  }, [user, fetchDhikrs]);

  const deleteDhikr = useCallback(async (id: string) => {
    if (!user) return;
    
    // Optimistic
    setDhikrs(curr => curr.filter(d => d.id !== id));
    if (selectedDhikrId === id) setSelectedDhikrId(null);
    
    await supabase.from('dhikrs').delete().eq('id', id);
  }, [user, selectedDhikrId]);

  const updateDhikr = useCallback(async (id: string, name: string, limit: number | null) => {
    if (!user) return;
    
    // Optimistic
    setDhikrs(curr => curr.map(d => d.id === id ? { ...d, name, dailyLimit: limit } : d));
    
    await supabase.from('dhikrs').update({
      name,
      daily_limit: limit,
    }).eq('id', id);
  }, [user]);

  const increment = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    const dhikr = dhikrs.find((d) => d.id === id);
    if (!dhikr) return false;

    if (dhikr.dailyLimit !== null && dhikr.dailyCount >= dhikr.dailyLimit) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return false; 
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (!pendingIncrementsRef.current[id]) {
      pendingIncrementsRef.current[id] = { delta: 0, timeout: null };
    }
    pendingIncrementsRef.current[id].delta += 1;

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
    
    if (pendingIncrementsRef.current[id]) {
      if (pendingIncrementsRef.current[id].timeout) {
        clearTimeout(pendingIncrementsRef.current[id].timeout!);
      }
      pendingIncrementsRef.current[id].delta = 0;
    }

    setDhikrs(current => current.map(d => {
      if (d.id === id) {
        return { ...d, dailyCount: 0, lastResetDate: getTodayDate() };
      }
      return d;
    }));

    await supabase.from('dhikrs').update({
      daily_count: 0,
      last_reset_date: getTodayDate(),
    }).eq('id', id);
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
