import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDhikr } from '../../context/DhikrContext';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeColors, predefinedThemes, ThemeName } from '../../utils/theme';
import { LanguageCode } from '../../i18n/translations';
import { apiRequest } from '../../config/api';
import * as Haptics from 'expo-haptics';
import Fireworks from '../../components/Fireworks';
import FlagIcon from '../../components/FlagIcon';
import AdminPanel from '../../components/AdminPanel';
import Constants from 'expo-constants';
import { APP_VERSION } from '../../constants/version';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const LANGUAGES = [
  { code: 'en', name: 'English', countryCode: 'gb' },
  { code: 'de', name: 'Deutsch', countryCode: 'de' },
  { code: 'fr', name: 'Français', countryCode: 'fr' },
  { code: 'sq', name: 'Shqip', countryCode: 'al' },
];

export default function CounterScreen() {
  const {
    selectedDhikr, dhikrs, increment, selectDhikr,
    resetDaily, addDhikr, deleteDhikr, updateDhikr,
    refreshDhikrs, syncError, loading: dhikrLoading,
  } = useDhikr();
  const { user, logout } = useAuth();
  
  // Customization hooks
  const { colors, themeName, setTheme } = useAppTheme();
  const { t, language, setLanguage } = useLanguage();
  const styles = getStyles(colors);

  // ─── Counter State ───────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const warningFadeAnim = useRef(new Animated.Value(0)).current;
  const [showFireworks, setShowFireworks] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // ─── Panel Visibility ────────────────────────────
  const [showDhikrsPanel, setShowDhikrsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ─── Dhikr Add/Edit Modal ────────────────────────
  const [dhikrModalVisible, setDhikrModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDhikrName, setNewDhikrName] = useState('');
  const [newDhikrLimit, setNewDhikrLimit] = useState('');
  const [modalError, setModalError] = useState('');

  // ─── Counter Logic ───────────────────────────────

  useEffect(() => {
    if (!selectedDhikr && dhikrs.length > 0) {
      selectDhikr(dhikrs[0].id);
    }
  }, [dhikrs, selectedDhikr]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(warningFadeAnim, {
      toValue: showLimitWarning ? 1 : 0,
      duration: showLimitWarning ? 300 : 200,
      useNativeDriver: true,
    }).start();
  }, [showLimitWarning]);

  // Sync server preferences (theme/language) on login
  useEffect(() => {
    if (!user) return;
    if (user.theme && user.theme in predefinedThemes) {
      setTheme(user.theme as ThemeName);
    }
    if (user.language && ['en','de','fr','sq'].includes(user.language)) {
      setLanguage(user.language as LanguageCode);
    }
  }, [user]);

  const clearWarning = () => {
    if (showLimitWarning) setShowLimitWarning(false);
  };

  const handleTap = async () => {
    if (!selectedDhikr) return;

    if (selectedDhikr.dailyLimit !== null && selectedDhikr.dailyCount >= selectedDhikr.dailyLimit) {
      setShowLimitWarning(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const isHittingLimit = selectedDhikr.dailyLimit !== null && (selectedDhikr.dailyCount + 1 === selectedDhikr.dailyLimit);
    const success = await increment(selectedDhikr.id);
    if (success && isHittingLimit) {
      setShowFireworks(true);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const cycleDhikr = (direction: 'next' | 'prev') => {
    if (dhikrs.length === 0) return;
    clearWarning();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = dhikrs.findIndex(d => d.id === selectedDhikr?.id);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % dhikrs.length
      : (currentIndex - 1 + dhikrs.length) % dhikrs.length;
    selectDhikr(dhikrs[newIndex].id);
  };

  const handleReset = async () => {
    if (!selectedDhikr) return;
    clearWarning();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === 'web' && window.confirm) {
      if (window.confirm(t('resetDhikrConfirm'))) await resetDaily(selectedDhikr.id);
    } else {
      await resetDaily(selectedDhikr.id);
    }
  };

  // ─── Dhikrs Panel Logic ──────────────────────────

  const openCreateModal = () => {
    setEditingId(null);
    setNewDhikrName('');
    setNewDhikrLimit('');
    setModalError('');
    setDhikrModalVisible(true);
  };

  const openEditModal = (id: string, name: string, limit: number | null) => {
    setEditingId(id);
    setNewDhikrName(name);
    setNewDhikrLimit(limit ? limit.toString() : '');
    setModalError('');
    setDhikrModalVisible(true);
  };

  const handleSaveDhikr = async () => {
    setModalError('');
    if (!newDhikrName.trim()) {
      setModalError(t('errorNoName'));
      return;
    }
    const limit = newDhikrLimit ? parseInt(newDhikrLimit, 10) : null;
    if (limit !== null && (isNaN(limit) || limit <= 0)) {
      setModalError(t('errorLimitPositive'));
      return;
    }
    try {
      if (editingId) {
        await updateDhikr(editingId, newDhikrName.trim(), limit);
      } else {
        await addDhikr(newDhikrName.trim(), limit);
      }
      setDhikrModalVisible(false);
    } catch (e: any) {
      setModalError(e.message);
    }
  };

  const handleSelectDhikr = (id: string) => {
    selectDhikr(id);
    clearWarning();
    setShowDhikrsPanel(false);
  };

  const handleDeleteDhikr = (id: string, name: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t('deleteConfirmBody', { name }))) deleteDhikr(id);
    } else {
      deleteDhikr(id);
    }
  };

  // ─── Settings Logic ──────────────────────────────

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(t('signOutConfirm'))) {
        try { await logout(); } catch (e: any) { alert(e.message); }
      }
    } else {
      try { await logout(); } catch (e: any) { console.error(e.message); }
    }
  };

  // ─── Render ──────────────────────────────────────

  return (
    <View style={styles.container}>
      {showFireworks && <Fireworks onComplete={() => setShowFireworks(false)} />}

      {selectedDhikr ? (
        <>
          {/* Top Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.navButton} onPress={() => cycleDhikr('prev')}>
              <Text style={styles.navIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.dhikrNameContainer}>
              <Text style={styles.dhikrName} numberOfLines={2}>{selectedDhikr.name}</Text>
            </View>
            <TouchableOpacity style={styles.navButton} onPress={() => cycleDhikr('next')}>
              <Text style={styles.navIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Main Counter Area */}
          <TouchableOpacity
            style={styles.mainCounterArea}
            activeOpacity={1}
            onPress={handleTap}
          >
            <Animated.Text style={[styles.massiveNumber, { opacity: fadeAnim }]}>
              {selectedDhikr.totalCount}
            </Animated.Text>
            <Animated.View style={[styles.warningContainer, { opacity: warningFadeAnim }]}>
              <Text style={styles.warningText}>{t('changeLimitWarning')}</Text>
            </Animated.View>
          </TouchableOpacity>
        </>
      ) : (
        /* Empty State */
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>☪</Text>
          <Text style={styles.emptyStateTitle}>{t('noDhikrsYet')}</Text>
          <Text style={styles.emptyStateSubtitle}>{t('addFirstDhikr')}</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openCreateModal}>
            <Text style={styles.emptyStateButtonText}>{t('addDhikrBtn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Bottom Toolbar ─── */}
      <View style={styles.bottomToolbar}>
        <View style={styles.toolItem}>
          <TouchableOpacity style={styles.toolButton} onPress={handleReset}>
            <Text style={styles.toolIcon}>↺</Text>
          </TouchableOpacity>
          <Text style={styles.toolLabel}>{t('resetLabel')}</Text>
        </View>
        <View style={styles.toolItem}>
          <TouchableOpacity style={styles.toolButton} onPress={() => setShowDhikrsPanel(true)}>
            <Text style={styles.toolIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.toolLabel}>{t('dhikrsLabel')}</Text>
        </View>
        <View style={styles.toolItem}>
          <TouchableOpacity style={styles.toolButton} onPress={() => setShowSettingsPanel(true)}>
            <Text style={styles.toolIcon}>⚙</Text>
          </TouchableOpacity>
          <Text style={styles.toolLabel}>{t('settingsLabel')}</Text>
        </View>
      </View>

      {/* ─── Dhikrs Bottom Sheet Panel ─── */}
      <Modal
        animationType="slide"
        transparent
        visible={showDhikrsPanel}
        onRequestClose={() => setShowDhikrsPanel(false)}
      >
        <Pressable style={styles.panelOverlay} onPress={() => setShowDhikrsPanel(false)}>
          <Pressable style={styles.panelContent} onPress={e => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.panelHandleRow}>
              <View style={styles.panelHandle} />
            </View>

            {/* Header */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t('myDhikrs')}</Text>
              <TouchableOpacity style={styles.panelAddBtn} onPress={openCreateModal}>
                <Text style={styles.panelAddBtnText}>{t('newBtn')}</Text>
              </TouchableOpacity>
            </View>

            {/* Dhikr List */}
            <FlatList
              data={dhikrs}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.panelList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dhikrCard,
                    selectedDhikr?.id === item.id && styles.dhikrCardSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDhikr(item.id)}
                >
                  <View style={styles.dhikrCardHeader}>
                    <Text style={styles.dhikrCardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.dhikrCardActions}>
                      <TouchableOpacity
                        style={styles.dhikrCardActionBtn}
                        onPress={() => openEditModal(item.id, item.name, item.dailyLimit)}
                      >
                        <Text style={styles.dhikrCardActionIcon}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dhikrCardActionBtn}
                        onPress={() => handleDeleteDhikr(item.id, item.name)}
                      >
                        <Text style={[styles.dhikrCardActionIcon, { color: colors.error }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dhikrCardCounts}>
                    <Text style={styles.dhikrCardTotal}>{t('totalLabel')} {item.totalCount}</Text>
                    {item.dailyLimit !== null ? (
                      <Text style={[
                        styles.dhikrCardDaily,
                        { color: item.dailyCount >= item.dailyLimit ? colors.success : item.dailyCount >= item.dailyLimit * 0.7 ? colors.warning : colors.error }
                      ]}>
                        {t('todayLabel')} {item.dailyCount}/{item.dailyLimit}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.panelEmpty}>
                  <Text style={styles.panelEmptyIcon}>☰</Text>
                  <Text style={styles.panelEmptyText}>{t('noDhikrsAdded')}</Text>
                  <Text style={styles.panelEmptySubtext}>{t('tapNewToCreate')}</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Settings Bottom Sheet Panel ─── */}
      <Modal
        animationType="slide"
        transparent
        visible={showSettingsPanel}
        onRequestClose={() => setShowSettingsPanel(false)}
      >
        <Pressable style={styles.panelOverlay} onPress={() => setShowSettingsPanel(false)}>
          <Pressable style={styles.panelContent} onPress={e => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.panelHandleRow}>
              <View style={styles.panelHandle} />
            </View>

            {/* Header */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{t('settings')}</Text>
              <TouchableOpacity onPress={() => setShowSettingsPanel(false)}>
                <Text style={styles.panelCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Settings Content */}
            <ScrollView style={styles.settingsBody} showsVerticalScrollIndicator={false}>
              
              {/* Account */}
              <Text style={styles.settingsSectionLabel}>{t('accountSection')}</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>{t('displayName')}</Text>
                  <Text style={styles.settingsRowValue} numberOfLines={1}>
                    {user?.display_name || user?.email || 'User'}
                  </Text>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>Email</Text>
                  <Text style={styles.settingsRowValue} numberOfLines={1}>{user?.email}</Text>
                </View>
                {user?.role === 'admin' && (
                  <>
                    <View style={styles.settingsDivider} />
                    <TouchableOpacity style={styles.settingsRow} onPress={() => { setShowSettingsPanel(false); setTimeout(() => setShowAdminPanel(true), 300) }}>
                      <Text style={[styles.settingsRowLabel, { color: colors.primary, fontWeight: '700' }]}>{t('adminPanel')}</Text>
                      <Text style={[styles.settingsRowValue, { color: colors.primary }]}>→</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Theme / Appearance */}
              <Text style={[styles.settingsSectionLabel, { marginTop: 24 }]}>{t('appearanceSection')}</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>Theme</Text>
                  <View style={styles.swatchContainer}>
                    {Object.keys(predefinedThemes).map((tName) => {
                      const tColors = predefinedThemes[tName as ThemeName];
                      return (
                        <TouchableOpacity
                          key={tName}
                          onPress={() => {
                            setTheme(tName as ThemeName);
                            apiRequest('save_preferences', 'POST', { theme: tName }).catch(() => {});
                          }}
                          style={[
                            styles.swatch,
                            { backgroundColor: tColors.background },
                            themeName === tName && styles.swatchSelected
                          ]}
                        >
                          <View style={[styles.swatchInner, { backgroundColor: tColors.primary }]} />
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              </View>

              {/* Language */}
              <Text style={[styles.settingsSectionLabel, { marginTop: 24 }]}>{t('languageSection')}</Text>
              <View style={styles.languageRowContainer}>
                {LANGUAGES.map((l) => (
                  <TouchableOpacity
                    key={l.code}
                    style={[
                      styles.languageBtn,
                      language === l.code && styles.languageBtnActive
                    ]}
                    onPress={() => {
                      setLanguage(l.code as LanguageCode);
                      apiRequest('save_preferences', 'POST', { language: l.code }).catch(() => {});
                    }}
                  >
                    <FlagIcon countryCode={l.countryCode} size={20} />
                    <Text style={[
                      styles.languageBtnText,
                      language === l.code && styles.languageBtnTextActive
                    ]}>
                      {l.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sync Status */}
              <Text style={[styles.settingsSectionLabel, { marginTop: 24 }]}>SYNC</Text>
              <View style={styles.settingsCard}>
                <TouchableOpacity
                  style={styles.settingsRow}
                  onPress={async () => {
                    await refreshDhikrs();
                    // Also sync preferences
                    try {
                      const data = await apiRequest('get_profile', 'POST');
                      if (data.user) {
                        if (data.user.theme && data.user.theme in predefinedThemes && data.user.theme !== themeName) {
                          setTheme(data.user.theme as ThemeName);
                        }
                        if (data.user.language && ['en','de','fr','sq'].includes(data.user.language) && data.user.language !== language) {
                          setLanguage(data.user.language as LanguageCode);
                        }
                      }
                    } catch {}
                  }}
                  disabled={dhikrLoading}
                >
                  <Text style={styles.settingsRowLabel}>{dhikrLoading ? 'Syncing...' : 'Refresh from server'}</Text>
                  {syncError ? (
                    <Text style={[styles.settingsRowValue, { color: colors.error, fontSize: 12 }]} numberOfLines={1}>
                      {syncError}
                    </Text>
                  ) : null}
                </TouchableOpacity>
                {syncError ? (
                  <>
                    <View style={styles.settingsDivider} />
                    <TouchableOpacity style={styles.settingsRow} onPress={async () => {
                      await refreshDhikrs();
                      try {
                        const data = await apiRequest('get_profile', 'POST');
                        if (data.user) {
                          if (data.user.theme && data.user.theme in predefinedThemes && data.user.theme !== themeName) {
                            setTheme(data.user.theme as ThemeName);
                          }
                          if (data.user.language && ['en','de','fr','sq'].includes(data.user.language) && data.user.language !== language) {
                            setLanguage(data.user.language as LanguageCode);
                          }
                        }
                      } catch {}
                    }}>
                      <Text style={[styles.settingsRowLabel, { color: colors.error }]}>Retry sync</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>

              {/* About */}
              <Text style={[styles.settingsSectionLabel, { marginTop: 24 }]}>{t('aboutSection')}</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>{t('version')}</Text>
                  <Text style={styles.settingsRowValue}>{APP_VERSION}</Text>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>{t('madeBy')}</Text>
                  <Text style={styles.settingsRowValue}>Uranik Sejdiu</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t('signOut')}</Text>
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Admin Panel Modal ─── */}
      <Modal
        animationType="slide"
        transparent
        visible={showAdminPanel}
        onRequestClose={() => setShowAdminPanel(false)}
      >
        <Pressable style={styles.panelOverlay} onPress={() => setShowAdminPanel(false)}>
          <Pressable style={styles.panelContent} onPress={e => e.stopPropagation()}>
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Add / Edit Dhikr Form Modal ─── */}
      <Modal
        animationType="fade"
        transparent
        visible={dhikrModalVisible}
        onRequestClose={() => setDhikrModalVisible(false)}
      >
        <Pressable style={styles.formOverlay} onPress={() => setDhikrModalVisible(false)}>
          <Pressable style={styles.formContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.formTitle}>
              {editingId ? t('editDhikr') : t('newDhikr')}
            </Text>

            {modalError ? (
              <Text style={styles.formError}>{modalError}</Text>
            ) : null}

            <Text style={styles.formLabel}>{t('nameLabel')}</Text>
            <TextInput
              style={styles.formInput}
              placeholder={t('namePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newDhikrName}
              onChangeText={setNewDhikrName}
              autoFocus
            />

            <Text style={styles.formLabel}>{t('limitLabel')}</Text>
            <TextInput
              style={styles.formInput}
              placeholder={t('limitPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={newDhikrLimit}
              onChangeText={setNewDhikrLimit}
              keyboardType="number-pad"
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setDhikrModalVisible(false)}
              >
                <Text style={styles.formCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveDhikr}>
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.formSaveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.formSaveText}>{t('saveBtn')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ─── Top Navigation ───
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  navButton: {
    padding: 10,
  },
  navIcon: {
    color: colors.textSecondary,
    fontSize: 50,
    fontWeight: '300',
    lineHeight: 50,
  },
  dhikrNameContainer: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dhikrName: {
    color: colors.success,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ─── Counter Area ───
  mainCounterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    userSelect: 'none',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  } as any,
  massiveNumber: {
    color: colors.textSecondary,
    fontSize: 160,
    fontWeight: '200',
    letterSpacing: -5,
  },
  warningContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: colors.error + '1A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.error + '4D',
  },
  warningText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ─── Empty State ───
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 56,
    color: colors.primary,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyStateButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Bottom Toolbar ───
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 28,
    paddingTop: 8,
  },
  toolItem: {
    alignItems: 'center',
    gap: 4,
  },
  toolButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    WebkitTapHighlightColor: 'transparent',
  },
  toolIcon: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: Platform.OS === 'ios' ? -2 : 0, 
  },
  toolLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  // ─── Shared Panel Styles (Bottom Sheet) ───
  panelOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  panelContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  panelHandleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary + '80',
    borderRadius: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  panelCloseIcon: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '400',
    padding: 4,
  },
  panelAddBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelAddBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  panelList: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },

  // ─── Dhikr Card (inside panel) ───
  dhikrCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.card,
  },
  dhikrCardSelected: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.surfaceLight,
  },
  dhikrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dhikrCardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  dhikrCardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  dhikrCardActionBtn: {
    padding: 6,
  },
  dhikrCardActionIcon: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  dhikrCardCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dhikrCardDaily: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dhikrCardTotal: {
    color: colors.textMuted,
    fontSize: 12,
  },

  // ─── Progress Bar (inside dhikr card) ───
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: colors.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ─── Panel Empty State ───
  panelEmpty: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  panelEmptyIcon: {
    fontSize: 40,
    color: colors.textMuted,
    marginBottom: 12,
    opacity: 0.5,
  },
  panelEmptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  panelEmptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
  },

  // ─── Settings Panel ───
  settingsBody: {
    padding: 24,
  },
  settingsSectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.card,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingsRowLabel: {
    color: colors.text,
    fontSize: 15,
  },
  settingsRowValue: {
    color: colors.textSecondary,
    fontSize: 15,
    maxWidth: '55%',
    textAlign: 'right',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.card,
    marginLeft: 16,
  },
  swatchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderColor: colors.primary,
  },
  swatchInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  
  // ─── Language Buttons ───
  languageRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.card,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  languageBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  languageBtnFlag: {
    fontSize: 16,
  },
  languageBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  languageBtnTextActive: {
    color: colors.primary,
  },

  logoutButton: {
    backgroundColor: colors.error + '1A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '4D',
    marginTop: 32,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Modals (Add Dhikr & Alert) ───
  formOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  formContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.card,
  },
  formTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  formError: {
    color: colors.error,
    marginBottom: 16,
    fontSize: 14,
  },
  formLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  formInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  formCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  formCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  formSaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  formSaveText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
