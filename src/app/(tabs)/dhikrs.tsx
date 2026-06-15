import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDhikr } from '../../context/DhikrContext';
import { theme } from '../../utils/theme';

export default function DhikrsScreen() {
  const { dhikrs, selectDhikr, addDhikr, deleteDhikr, updateDhikr, resetDaily } = useDhikr();
  const router = useRouter();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDhikrName, setNewDhikrName] = useState('');
  const [newDhikrLimit, setNewDhikrLimit] = useState('');
  const [modalError, setModalError] = useState('');

  const openCreateModal = () => {
    setEditingId(null);
    setNewDhikrName('');
    setNewDhikrLimit('');
    setModalError('');
    setModalVisible(true);
  };

  const openEditModal = (id: string, name: string, limit: number | null) => {
    setEditingId(id);
    setNewDhikrName(name);
    setNewDhikrLimit(limit ? limit.toString() : '');
    setModalError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    setModalError('');
    if (!newDhikrName.trim()) {
      setModalError('Please enter a name for the dhikr');
      return;
    }
    
    const limit = newDhikrLimit ? parseInt(newDhikrLimit, 10) : null;
    if (limit !== null && (isNaN(limit) || limit <= 0)) {
      setModalError('Daily limit must be a positive number');
      return;
    }

    try {
      if (editingId) {
        await updateDhikr(editingId, newDhikrName.trim(), limit);
      } else {
        await addDhikr(newDhikrName.trim(), limit);
      }
      setModalVisible(false);
    } catch (e: any) {
      setModalError(e.message);
    }
  };

  const handleSelect = (id: string) => {
    selectDhikr(id);
    router.navigate('/(tabs)/counter');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Dhikr',
      `Are you sure you want to delete "${name}"? All counts will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteDhikr(id)
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Dhikrs</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dhikrs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleSelect(item.id)}
            onLongPress={() => handleDelete(item.id, item.name)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <TouchableOpacity 
                style={styles.editIconBtn}
                onPress={() => openEditModal(item.id, item.name, item.dailyLimit)}
              >
                <Text style={styles.editIconText}>✎</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.countsRow}>
              <Text style={styles.dailyCount}>
                Today: {item.dailyCount}
                {item.dailyLimit ? ` / ${item.dailyLimit}` : ''}
              </Text>
              <Text style={styles.totalCount}>Total: {item.totalCount}</Text>
            </View>

            {item.dailyLimit && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={
                      item.dailyCount >= item.dailyLimit
                        ? ['#2BA06D', '#1A7A52']
                        : ['#C9A84C', '#9B7E2E']
                    }
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min((item.dailyCount / item.dailyLimit) * 100, 100)}%` } as any
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
              </View>
            )}
            
            <View style={styles.cardActions}>
               <TouchableOpacity 
                  onPress={() => {
                     Alert.alert('Reset Daily Count', 'Are you sure you want to reset today\'s count to 0?', [
                        {text: 'Cancel', style: 'cancel'},
                        {text: 'Reset', onPress: () => resetDaily(item.id)}
                     ])
                  }}
                  style={styles.resetButton}
               >
                  <Text style={styles.resetButtonText}>Reset Today</Text>
               </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No dhikrs added yet</Text>
            <Text style={styles.emptySubtext}>Click '+ New' to add your first dhikr</Text>
          </View>
        }
      />

      {/* Add/Edit Dhikr Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Dhikr' : 'New Dhikr'}</Text>
            
            {modalError ? (
              <Text style={{ color: '#E74C3C', marginBottom: 16 }}>{modalError}</Text>
            ) : null}

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Dhikr Name (e.g. SubhanAllah)"
              placeholderTextColor={theme.colors.textMuted}
              value={newDhikrName}
              onChangeText={setNewDhikrName}
            />
            
            <Text style={styles.inputLabel}>Daily Limit (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              placeholderTextColor={theme.colors.textMuted}
              value={newDhikrLimit}
              onChangeText={setNewDhikrLimit}
              keyboardType="number-pad"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleSave}>
                <LinearGradient
                  colors={theme.colors.gradientGold}
                  style={styles.modalCreateButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.modalCreateText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  list: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  editIconBtn: {
    padding: 8,
  },
  editIconText: {
    color: theme.colors.textSecondary,
    fontSize: 20,
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dailyCount: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  totalCount: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardActions: {
     marginTop: theme.spacing.sm,
     alignItems: 'flex-end',
  },
  resetButton: {
     paddingVertical: 6,
     paddingHorizontal: 12,
     backgroundColor: theme.colors.surfaceLight,
     borderRadius: theme.borderRadius.sm,
  },
  resetButtonText: {
     ...theme.typography.caption,
     color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.bodySmall,
    color: theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    ...theme.typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  modalCreateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
  },
  modalCreateText: {
    color: theme.colors.background,
    fontWeight: '700',
  },
});
