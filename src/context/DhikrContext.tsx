import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const DHIKR_CACHE_KEY = '@dhikr_list_cache';
const DHIKR_PENDING_KEY = '@dhikr_pending_deltas';

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

  // Helper: Save current dhikrs to local cache
  const saveDhikrsToCache = useCallback(async (items: UIDhikr[]) => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(`${DHIKR_CACHE_KEY}_${user.id}`, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save dhikrs cache:', err);
    }
  }, [user]);

  // Helper: Save current pending queue to AsyncStorage
  const savePendingDeltasToCache = useCallback(async () => {
    if (!user) return;
    try {
      const deltasToSave: Record<string, number> = {};
      Object.keys(pendingIncrementsRef.current).forEach((id) => {
        const delta = pendingIncrementsRef.current[id]?.delta || 0;
        if (delta !== 0) {
          deltasToSave[id] = delta;
        }
      });
      await AsyncStorage.setItem(`${DHIKR_PENDING_KEY}_${user.id}`, JSON.stringify(deltasToSave));
    } catch (err) {
      console.warn('Failed to save pending deltas cache:', err);
    }
  }, [user]);

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
    // Write fetched items to cache
    saveDhikrsToCache(items);
  }, [user, saveDhikrsToCache]);

  const syncPending = useCallback(async (id: string) => {
    const pending = pendingIncrementsRef.current[id];
    if (!pending || pending.delta === 0 || !user) return;

    const deltaToSync = pending.delta;
    pending.delta = 0;
    await savePendingDeltasToCache();

    try {
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
        await savePendingDeltasToCache();
      }
    }
  }, [user, savePendingDeltasToCache]);

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

  // Sync all pending deltas immediately (startup, unload, backgrounding)
  const syncAllPendingImmediate = useCallback(async () => {
    if (!user) return;

    const ids = Object.keys(pendingIncrementsRef.current);
    const syncPromises = ids.map(async (id) => {
      const pending = pendingIncrementsRef.current[id];
      if (!pending || pending.delta === 0) return;

      if (pending.timeout) {
        clearTimeout(pending.timeout);
        pending.timeout = null;
      }

      const deltaToSync = pending.delta;
      pending.delta = 0;
      await savePendingDeltasToCache();

      try {
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
        } else if (error) {
          throw error;
        }
      } catch (e) {
        console.error(`Failed to sync pending for ${id}:`, e);
        if (pendingIncrementsRef.current[id]) {
          pendingIncrementsRef.current[id].delta += deltaToSync;
          await savePendingDeltasToCache();
        }
      }
    });

    await Promise.all(syncPromises);
  }, [user, savePendingDeltasToCache]);

  // 1. Initial Cache Load & Startup Sync
  useEffect(() => {
    if (!user) {
      setDhikrs([]);
      setSelectedDhikrId(null);
      setLoading(false);
      return;
    }

    const loadCacheAndSync = async () => {
      try {
        // Load cache list
        const cachedDhikrsJson = await AsyncStorage.getItem(`${DHIKR_CACHE_KEY}_${user.id}`);
        if (cachedDhikrsJson) {
          const parsed = JSON.parse(cachedDhikrsJson);
          setDhikrs(parsed);
          setLoading(false);
        }

        // Load pending deltas
        const pendingDeltasJson = await AsyncStorage.getItem(`${DHIKR_PENDING_KEY}_${user.id}`);
        if (pendingDeltasJson) {
          const parsedDeltas = JSON.parse(pendingDeltasJson);
          Object.keys(parsedDeltas).forEach((id) => {
            pendingIncrementsRef.current[id] = {
              delta: parsedDeltas[id],
              timeout: null,
            };
          });
        }

        // Run startup sync for any left-over deltas
        await syncAllPendingImmediate();
      } catch (err) {
        console.warn('Failed to load local dhikr cache:', err);
      }
    };

    loadCacheAndSync();
  }, [user, syncAllPendingImmediate]);

  // 2. Fetch network data & register Realtime channel
  useEffect(() => {
    if (!user) return;

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
        () => {
          fetchDhikrs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDhikrs]);

  // 3. Keep cache updated with local UI state (optimistic updates, deletions, etc.)
  useEffect(() => {
    if (user && !loading) {
      saveDhikrsToCache(dhikrs);
    }
  }, [dhikrs, user, loading, saveDhikrsToCache]);

  // 4. Mobile AppState Change Listener (Sync on Close / Backgrounding)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        syncAllPendingImmediate();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [syncAllPendingImmediate]);

  // 5. Web beforeunload Event Listener (Sync on Browser Close / Tab Close)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleBeforeUnload = () => {
        syncAllPendingImmediate();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [syncAllPendingImmediate]);

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
    await savePendingDeltasToCache();

    setDhikrs(current => current.map(d => {
      if (d.id === id) {
        return { ...d, dailyCount: d.dailyCount + 1, totalCount: d.totalCount + 1 };
      }
      return d;
    }));

    scheduleSync(id);
    return true;
  }, [user, dhikrs, scheduleSync, savePendingDeltasToCache]);

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
    await savePendingDeltasToCache();

    setDhikrs(current => current.map(d => {
      if (d.id === id) {
        return { ...d, dailyCount: Math.max(0, d.dailyCount - 1), totalCount: Math.max(0, d.totalCount - 1) };
      }
      return d;
    }));

    scheduleSync(id);
  }, [user, dhikrs, scheduleSync, savePendingDeltasToCache]);

  const resetDaily = useCallback(async (id: string) => {
    if (!user) return;
    
    if (pendingIncrementsRef.current[id]) {
      if (pendingIncrementsRef.current[id].timeout) {
        clearTimeout(pendingIncrementsRef.current[id].timeout!);
      }
      pendingIncrementsRef.current[id].delta = 0;
      await savePendingDeltasToCache();
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
  }, [user, savePendingDeltasToCache]);

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
