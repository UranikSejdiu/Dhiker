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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDhikr } from '../../context/DhikrContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../utils/theme';
import * as Haptics from 'expo-haptics';
import Fireworks from '../../components/Fireworks';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function CounterScreen() {
  const {
    selectedDhikr, dhikrs, increment, decrement, selectDhikr,
    resetDaily, addDhikr, deleteDhikr, updateDhikr,
  } = useDhikr();
  const { user, logout } = useAuth();

  // ─── Counter State ───────────────────────────────
  const [mode, setMode] = useState<'increment' | 'decrement'>('increment');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const warningFadeAnim = useRef(new Animated.Value(0)).current;
  const [showFireworks, setShowFireworks] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);

  // ─── Panel Visibility ────────────────────────────
  const [showDhikrsPanel, setShowDhikrsPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

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

  const clearWarning = () => {
    if (showLimitWarning) setShowLimitWarning(false);
  };

  const handleTap = async () => {
    if (!selectedDhikr) return;

    if (mode === 'increment') {
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
    } else {
      clearWarning();
      if (selectedDhikr.dailyCount > 0) await decrement(selectedDhikr.id);
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

  const toggleMode = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(prev => prev === 'increment' ? 'decrement' : 'increment');
  };

  const handleReset = async () => {
    if (!selectedDhikr) return;
    clearWarning();
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === 'web' && window.confirm) {
      if (window.confirm('Reset this dhikr to 0?')) await resetDaily(selectedDhikr.id);
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
      setModalError('Please enter a name');
      return;
    }
    const limit = newDhikrLimit ? parseInt(newDhikrLimit, 10) : null;
    if (limit !== null && (isNaN(limit) || limit <= 0)) {
      setModalError('Limit must be a positive number');
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
      if (window.confirm(`Delete "${name}"? All counts will be lost.`)) deleteDhikr(id);
    } else {
      deleteDhikr(id);
    }
  };

  // ─── Settings Logic ──────────────────────────────

  const handleLogout = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) {
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
              {selectedDhikr.dailyCount}
            </Animated.Text>
            <Animated.View style={[styles.warningContainer, { opacity: warningFadeAnim }]}>
              <Text style={styles.warningText}>Change daily limit if you want to do more dhikr</Text>
            </Animated.View>
          </TouchableOpacity>
        </>
      ) : (
        /* Empty State */
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>☪</Text>
          <Text style={styles.emptyStateTitle}>No Dhikrs Yet</Text>
          <Text style={styles.emptyStateSubtitle}>Add your first dhikr to start counting</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={openCreateModal}>
            <Text style={styles.emptyStateButtonText}>+ Add Dhikr</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Bottom Toolbar ─── */}
      <View style={styles.bottomToolbar}>
        <TouchableOpacity style={styles.toolButton} onPress={toggleMode}>
          <Text style={[styles.toolIcon, mode === 'decrement' && styles.toolIconActive]}>
            {mode === 'increment' ? '+' : '−'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={handleReset}>
          <Text style={styles.toolIcon}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowDhikrsPanel(true)}>
          <Text style={styles.toolIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolButton} onPress={() => setShowSettingsPanel(true)}>
          <Text style={styles.toolIcon}>⚙</Text>
        </TouchableOpacity>
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
              <Text style={styles.panelTitle}>My Dhikrs</Text>
              <TouchableOpacity style={styles.panelAddBtn} onPress={openCreateModal}>
                <Text style={styles.panelAddBtnText}>+ New</Text>
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
                        <Text style={[styles.dhikrCardActionIcon, { color: '#E74C3C' }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.dhikrCardCounts}>
                    <Text style={styles.dhikrCardDaily}>
                      Today: {item.dailyCount}
                      {item.dailyLimit ? ` / ${item.dailyLimit}` : ''}
                    </Text>
                    <Text style={styles.dhikrCardTotal}>Total: {item.totalCount}</Text>
                  </View>

                  {item.dailyLimit ? (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarTrack}>
                        <LinearGradient
                          colors={
                            item.dailyCount >= item.dailyLimit
                              ? ['#2BA06D', '#1A7A52']
                              : ['#C9A84C', '#9B7E2E']
                          }
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.min((item.dailyCount / item.dailyLimit) * 100, 100)}%` } as any,
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.panelEmpty}>
                  <Text style={styles.panelEmptyIcon}>☰</Text>
                  <Text style={styles.panelEmptyText}>No dhikrs added yet</Text>
                  <Text style={styles.panelEmptySubtext}>Tap '+ New' to create one</Text>
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
              <Text style={styles.panelTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettingsPanel(false)}>
                <Text style={styles.panelCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Settings Content */}
            <View style={styles.settingsBody}>
              <Text style={styles.settingsSectionLabel}>ACCOUNT</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>Display Name</Text>
                  <Text style={styles.settingsRowValue} numberOfLines={1}>
                    {user?.user_metadata?.display_name || user?.user_metadata?.full_name || 'User'}
                  </Text>
                </View>
                <View style={styles.settingsDivider} />
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>Email</Text>
                  <Text style={styles.settingsRowValue} numberOfLines={1}>{user?.email}</Text>
                </View>
              </View>

              <Text style={[styles.settingsSectionLabel, { marginTop: 24 }]}>ABOUT</Text>
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsRowLabel}>Version</Text>
                  <Text style={styles.settingsRowValue}>1.0.0</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
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
              {editingId ? 'Edit Dhikr' : 'New Dhikr'}
            </Text>

            {modalError ? (
              <Text style={styles.formError}>{modalError}</Text>
            ) : null}

            <Text style={styles.formLabel}>Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Dhikr Name (e.g. SubhanAllah)"
              placeholderTextColor="#4A5568"
              value={newDhikrName}
              onChangeText={setNewDhikrName}
              autoFocus
            />

            <Text style={styles.formLabel}>Daily Limit (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 100"
              placeholderTextColor="#4A5568"
              value={newDhikrLimit}
              onChangeText={setNewDhikrLimit}
              keyboardType="number-pad"
            />

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setDhikrModalVisible(false)}
              >
                <Text style={styles.formCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveDhikr}>
                <LinearGradient
                  colors={theme.colors.gradientGold}
                  style={styles.formSaveBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.formSaveText}>Save</Text>
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

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    color: '#555',
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
    color: '#2ECC71',
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
    touchAction: 'none',
  } as any,
  massiveNumber: {
    color: '#888',
    fontSize: 160,
    fontWeight: '200',
    letterSpacing: -5,
  },
  warningContainer: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  warningText: {
    color: '#E74C3C',
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
    color: '#C9A84C',
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    color: '#F5F0E8',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#8A94A6',
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: '#C9A84C40',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyStateButtonText: {
    color: '#C9A84C',
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Bottom Toolbar ───
  bottomToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 28,
    paddingTop: 12,
  },
  toolButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toolIcon: {
    color: '#888',
    fontSize: 26,
    fontWeight: '300',
  },
  toolIconActive: {
    color: '#E74C3C',
  },

  // ─── Shared Panel Styles (Bottom Sheet) ───
  panelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  panelContent: {
    backgroundColor: '#0F1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  panelHandleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  panelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  panelTitle: {
    color: '#F5F0E8',
    fontSize: 22,
    fontWeight: '700',
  },
  panelCloseIcon: {
    color: '#8A94A6',
    fontSize: 20,
    fontWeight: '400',
    padding: 4,
  },
  panelAddBtn: {
    backgroundColor: '#162240',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.15)',
  },
  panelAddBtnText: {
    color: '#C9A84C',
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
    backgroundColor: '#162240',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2D50',
  },
  dhikrCardSelected: {
    borderColor: '#C9A84C60',
    backgroundColor: '#1A2B4A',
  },
  dhikrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dhikrCardTitle: {
    color: '#F5F0E8',
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
    color: '#8A94A6',
    fontSize: 18,
  },
  dhikrCardCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dhikrCardDaily: {
    color: '#C9A84C',
    fontSize: 14,
    fontWeight: '600',
  },
  dhikrCardTotal: {
    color: '#4A5568',
    fontSize: 12,
  },

  // ─── Progress Bar (inside dhikr card) ───
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1E2D50',
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
    color: '#4A5568',
    marginBottom: 12,
    opacity: 0.5,
  },
  panelEmptyText: {
    color: '#8A94A6',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  panelEmptySubtext: {
    color: '#4A5568',
    fontSize: 13,
  },

  // ─── Settings Panel ───
  settingsBody: {
    padding: 24,
  },
  settingsSectionLabel: {
    color: '#8A94A6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  settingsCard: {
    backgroundColor: '#162240',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2D50',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsRowLabel: {
    color: '#F5F0E8',
    fontSize: 15,
  },
  settingsRowValue: {
    color: '#8A94A6',
    fontSize: 15,
    maxWidth: '55%',
    textAlign: 'right',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#1E2D50',
    marginLeft: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    marginTop: 32,
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },

  // ─── Add/Edit Dhikr Form Modal ───
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  formContent: {
    backgroundColor: '#0F1A2E',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#1E2D50',
  },
  formTitle: {
    color: '#F5F0E8',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  formError: {
    color: '#E74C3C',
    marginBottom: 16,
    fontSize: 14,
  },
  formLabel: {
    color: '#8A94A6',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  formInput: {
    backgroundColor: '#060D1B',
    borderWidth: 1,
    borderColor: '#1E2D50',
    borderRadius: 12,
    padding: 14,
    color: '#F5F0E8',
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
    color: '#8A94A6',
    fontWeight: '600',
    fontSize: 15,
  },
  formSaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  formSaveText: {
    color: '#060D1B',
    fontWeight: '700',
    fontSize: 15,
  },
});
