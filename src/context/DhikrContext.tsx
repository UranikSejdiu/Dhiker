import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiRequest } from '../config/api';
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
  syncError: string | null;
  refreshDhikrs: () => Promise<void>;
  selectDhikr: (id: string | null) => void;
  addDhikr: (name: string, dailyLimit?: number | null) => Promise<void>;
  deleteDhikr: (id: string) => Promise<void>;
  updateDhikr: (id: string, name: string, limit: number | null) => Promise<void>;
  increment: (id: string) => Promise<boolean>;
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
  const [syncError, setSyncError] = useState<string | null>(null);

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
    
    try {
      setSyncError(null);
      const data = await apiRequest('fetch', 'POST');
      
      const items = data.dhikrs.map((d: any) => {
        const dbDhikr: Dhikr = {
          id: d.id,
          user_id: d.user_id,
          name: d.name,
          total_count: d.total_count,
          daily_count: d.daily_count,
          daily_limit: d.daily_limit,
          last_reset_date: d.last_reset_date,
          created_at: d.created_at,
        };
        
        return toUIDhikr(dbDhikr, pendingIncrementsRef.current[dbDhikr.id]?.delta || 0);
      });

      setDhikrs(items);
      setLoading(false);
      saveDhikrsToCache(items);
    } catch (err: any) {
      setSyncError(err.message || 'Failed to fetch dhikrs from server');
      setLoading(false);
      console.error('Error fetching dhikrs from server:', err);
    }
  }, [user, saveDhikrsToCache]);

  const refreshDhikrs = useCallback(async () => {
    setSyncError(null);
    setLoading(true);
    await fetchDhikrs();
  }, [fetchDhikrs]);

  const syncPending = useCallback(async (id: string) => {
    const pending = pendingIncrementsRef.current[id];
    if (!pending || pending.delta === 0 || !user) return;

    const deltaToSync = pending.delta;
    pending.delta = 0;
    await savePendingDeltasToCache();

    try {
      const data = await apiRequest('sync', 'POST', {
        deltas: { [id]: deltaToSync }
      });
      
      if (data.dhikrs) {
        const items = data.dhikrs.map((d: any) => {
          const dbDhikr: Dhikr = {
            id: d.id,
            user_id: d.user_id,
            name: d.name,
            total_count: d.total_count,
            daily_count: d.daily_count,
            daily_limit: d.daily_limit,
            last_reset_date: d.last_reset_date,
            created_at: d.created_at,
          };
          return toUIDhikr(dbDhikr, pendingIncrementsRef.current[dbDhikr.id]?.delta || 0);
        });
        setDhikrs(items);
      }
    } catch (e) {
      console.error('Failed to sync batch:', e);
      if (pendingIncrementsRef.current[id]) {
        // Only restore the original delta if no new increments were added during flight
        if (pendingIncrementsRef.current[id].delta === 0) {
          pendingIncrementsRef.current[id].delta += deltaToSync;
        }
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
    const deltasToSync: Record<string, number> = {};
    
    ids.forEach((id) => {
      const pending = pendingIncrementsRef.current[id];
      if (pending && pending.delta !== 0) {
        if (pending.timeout) {
          clearTimeout(pending.timeout);
          pending.timeout = null;
        }
        deltasToSync[id] = pending.delta;
        pending.delta = 0;
      }
    });

    if (Object.keys(deltasToSync).length === 0) return;
    await savePendingDeltasToCache();

    try {
      const data = await apiRequest('sync', 'POST', { deltas: deltasToSync });
      if (data.dhikrs) {
        const items = data.dhikrs.map((d: any) => {
          const dbDhikr: Dhikr = {
            id: d.id,
            user_id: d.user_id,
            name: d.name,
            total_count: d.total_count,
            daily_count: d.daily_count,
            daily_limit: d.daily_limit,
            last_reset_date: d.last_reset_date,
            created_at: d.created_at,
          };
          return toUIDhikr(dbDhikr, pendingIncrementsRef.current[dbDhikr.id]?.delta || 0);
        });
        setDhikrs(items);
      }
    } catch (e) {
      console.error('Failed to sync pending immediate:', e);
      Object.keys(deltasToSync).forEach((id) => {
        if (!pendingIncrementsRef.current[id]) {
          pendingIncrementsRef.current[id] = { delta: 0, timeout: null };
        }
        // Only restore if no new increments were added during flight
        if (pendingIncrementsRef.current[id].delta === 0) {
          pendingIncrementsRef.current[id].delta += deltasToSync[id];
        }
      });
      await savePendingDeltasToCache();
    }
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

  // 2. Fetch network data on mount / user change
  useEffect(() => {
    if (!user) return;
    fetchDhikrs();
  }, [user, fetchDhikrs]);

  // 2b. Web polling for real-time cross-device sync
  useEffect(() => {
    if (!user || Platform.OS !== 'web') return;
    const poll = () => {
      if (document.visibilityState === 'visible') fetchDhikrs();
    };
    const id = setInterval(poll, 10000);
    return () => clearInterval(id);
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

  // 5. Web beforeunload Event Listener — sync via keepalive fetch
  const lastKnownTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    lastKnownTokenRef.current = user.session_token;
  }, [user]);

  const syncAllDeltasKeepalive = useCallback(async () => {
    if (!user) return;
    const ids = Object.keys(pendingIncrementsRef.current);
    const deltasToSync: Record<string, number> = {};
    ids.forEach((id) => {
      const pending = pendingIncrementsRef.current[id];
      if (pending && pending.delta !== 0) {
        deltasToSync[id] = pending.delta;
        pending.delta = 0;
      }
    });
    if (Object.keys(deltasToSync).length === 0) return;
    await savePendingDeltasToCache();
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api/index.php`
      : '/api/index.php';
    const token = lastKnownTokenRef.current;
    if (!token) return;
    const url = `${baseUrl}?action=sync&_token=${encodeURIComponent(token)}`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltas: deltasToSync }),
        keepalive: true,
      });
    } catch (e) {
      console.error('Keepalive sync failed:', e);
    }
  }, [user, savePendingDeltasToCache]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleBeforeUnload = () => {
        const ids = Object.keys(pendingIncrementsRef.current);
        const deltasToSync: Record<string, number> = {};
        ids.forEach((id) => {
          const pending = pendingIncrementsRef.current[id];
          if (pending && pending.delta !== 0) {
            deltasToSync[id] = pending.delta;
          }
        });
        if (Object.keys(deltasToSync).length === 0) return;
        const baseUrl = `${window.location.origin}/api/index.php`;
        const token = lastKnownTokenRef.current;
        if (!token) return;
        const url = `${baseUrl}?action=sync&_token=${encodeURIComponent(token)}`;
        navigator.sendBeacon(url, JSON.stringify({ deltas: deltasToSync }));
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  // 6. Web online event — sync immediately when connectivity returns
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleOnline = () => {
      syncAllPendingImmediate();
      fetchDhikrs();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncAllPendingImmediate, fetchDhikrs]);

  const selectedDhikr = dhikrs.find((d) => d.id === selectedDhikrId) || null;

  const selectDhikr = useCallback((id: string | null) => {
    setSelectedDhikrId(id);
  }, []);

  const addDhikr = useCallback(async (name: string, dailyLimit?: number | null) => {
    if (!user) return;
    
    // Generate UUID locally
    const uuid = 'dhikr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
    
    // Optimistic UI update
    const tempDhikr: UIDhikr = {
      id: uuid,
      userId: user.id,
      name,
      totalCount: 0,
      dailyCount: 0,
      dailyLimit: dailyLimit ?? null,
      lastResetDate: getTodayDate(),
      createdAt: new Date().toISOString()
    };
    setDhikrs(curr => [tempDhikr, ...curr]);

    try {
      await apiRequest('add', 'POST', {
        id: uuid,
        name,
        daily_limit: dailyLimit ?? null
      });
      fetchDhikrs();
    } catch (error) {
      // Revert optimistic update
      setDhikrs(curr => curr.filter(d => d.id !== uuid));
      throw error;
    }
  }, [user, fetchDhikrs]);

  const deleteDhikr = useCallback(async (id: string) => {
    if (!user) return;
    
    // Optimistic
    setDhikrs(curr => curr.filter(d => d.id !== id));
    if (selectedDhikrId === id) setSelectedDhikrId(null);
    
    try {
      await apiRequest('delete', 'POST', { id });
    } catch (err) {
      console.warn('Failed to delete on server:', err);
      fetchDhikrs(); // refetch to revert
    }
  }, [user, selectedDhikrId, fetchDhikrs]);

  const updateDhikr = useCallback(async (id: string, name: string, limit: number | null) => {
    if (!user) return;
    
    // Optimistic
    setDhikrs(curr => curr.map(d => d.id === id ? { ...d, name, dailyLimit: limit } : d));
    
    try {
      await apiRequest('update', 'POST', { id, name, daily_limit: limit });
    } catch (err) {
      console.warn('Failed to update on server:', err);
      fetchDhikrs(); // refetch to revert
    }
  }, [user, fetchDhikrs]);

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
        return { ...d, dailyCount: 0, totalCount: 0, lastResetDate: getTodayDate() };
      }
      return d;
    }));

    try {
      await apiRequest('reset', 'POST', { id, reset_total: true });
    } catch (err) {
      console.warn('Failed to reset daily count on server:', err);
      fetchDhikrs();
    }
  }, [user, savePendingDeltasToCache, fetchDhikrs]);

  return (
    <DhikrContext.Provider
      value={{
        dhikrs,
        selectedDhikr,
        loading,
        syncError,
        refreshDhikrs,
        selectDhikr,
        addDhikr,
        deleteDhikr,
        updateDhikr,
        increment,
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
