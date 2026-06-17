import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../config/api';
import { ThemeColors } from '../utils/theme';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  theme: string | null;
  language: string | null;
  dhikr_count: number;
}

interface AdminStats {
  total_users: number;
  total_dhikrs: number;
  total_counts: number;
}

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { colors } = useAppTheme();
  const { t } = useLanguage();
  const styles = getStyles(colors);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiRequest('admin_users', 'POST'),
        apiRequest('admin_stats', 'POST'),
      ]);
      setUsers(usersRes.users || []);
      setStats(statsRes);
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.includes('Admin access required')) {
        setAuthorized(false);
      } else {
        setError(err.message || 'Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('adminPanel')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{t('adminAccessOnly')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('adminPanel')}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={[styles.retryBtnText, { color: colors.primary }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>{t('totalUsers')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total_dhikrs}</Text>
                <Text style={styles.statLabel}>{t('totalDhikrs')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total_counts.toLocaleString()}</Text>
                <Text style={styles.statLabel}>{t('totalCounts')}</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('users')}</Text>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>{t('email')}</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>{t('name')}</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>{t('role')}</Text>
                <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>{t('dhikrCount')}</Text>
              </View>
              {users.map((u, i) => (
                <View
                  key={u.id}
                  style={[
                    styles.tableRow,
                    i < users.length - 1 && styles.tableRowBorder,
                  ]}
                >
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{u.email}</Text>
                  <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>{u.display_name || '—'}</Text>
                  <Text style={[styles.tableCell, { flex: 0.8 }, u.role === 'admin' && { color: colors.primary }]}>
                    {u.role === 'admin' ? t('admin') : u.role}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'center' }]}>{u.dhikr_count}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeIcon: {
    fontSize: 22,
    color: colors.textSecondary,
    padding: 4,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
  },
  tableCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '60',
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
  },
});
