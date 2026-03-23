import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGearRegistry } from '@/features/gear/use-gear-registry';
import { colors } from '@/theme/colors';
import type { GearRegistryItem, GearType } from '@/types/domain';

const gearTypes: GearType[] = ['camera', 'lens', 'film'];

export default function GearRegistryScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const insets = useSafeAreaInsets();
  const initialType = gearTypes.includes(params.type as GearType)
    ? (params.type as GearType)
    : 'camera';
  const [activeType, setActiveType] = useState<GearType>(initialType);
  const [draftName, setDraftName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (!gearTypes.includes(params.type as GearType)) {
      return;
    }

    setActiveType(params.type as GearType);
  }, [params.type]);

  useEffect(() => {
    setDraftName('');
    setEditingItemId(null);
    setEditingName('');
  }, [activeType]);

  const { visibleItems, createItem, deleteItem, updateItem, error, loading } = useGearRegistry(
    activeType,
    '',
  );

  const title = useMemo(() => {
    if (activeType === 'film') {
      return 'Film Stock';
    }

    return activeType.charAt(0).toUpperCase() + activeType.slice(1);
  }, [activeType]);

  const handleCreate = async () => {
    if (!draftName.trim()) {
      return;
    }

    await createItem(draftName);
    setDraftName('');
  };

  const startEditing = (item: GearRegistryItem) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
  };

  const handleSave = async () => {
    if (!editingItemId || !editingName.trim()) {
      return;
    }

    await updateItem(editingItemId, editingName);
    setEditingItemId(null);
    setEditingName('');
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Gear Registry</Text>
      <Text style={styles.subheading}>
        Manage reusable {title.toLowerCase()} entries separately from the quick-select overlays.
      </Text>

      <View style={styles.typeTabs}>
        {gearTypes.map((type) => (
          <Pressable
            key={type}
            onPress={() => setActiveType(type)}
            style={[styles.typeTab, activeType === type ? styles.typeTabActive : null]}
          >
            <Text style={activeType === type ? styles.typeTabTextActive : styles.typeTabText}>
              {type === 'film' ? 'Film' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add {title}</Text>
        <TextInput
          onChangeText={setDraftName}
          placeholder={`New ${title.toLowerCase()}`}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          value={draftName}
        />
        <Pressable
          onPress={() => void handleCreate()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Save {title}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{title} Items</Text>
        {loading ? <Text style={styles.metaText}>Loading...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {visibleItems.length === 0 && !loading ? (
          <Text style={styles.metaText}>No items yet.</Text>
        ) : null}

        <View style={styles.list}>
          {visibleItems.map((item) => (
            <View
              key={item.id}
              style={styles.listItem}
            >
              {editingItemId === item.id ? (
                <>
                  <TextInput
                    onChangeText={setEditingName}
                    placeholder="Rename item"
                    placeholderTextColor={colors.text.muted}
                    style={styles.input}
                    value={editingName}
                  />
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => {
                        setEditingItemId(null);
                        setEditingName('');
                      }}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void handleSave()}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.rowActions}>
                    <Pressable
                      onPress={() => startEditing(item)}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Rename</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          `Delete ${title.toLowerCase()}?`,
                          `"${item.name}" will be permanently removed from the gear registry.`,
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: () => void deleteItem(item.id),
                            },
                          ],
                        );
                      }}
                      style={styles.destructiveButton}
                    >
                      <Text style={styles.destructiveButtonText}>Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  typeTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTab: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background.surface,
  },
  typeTabActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  typeTabText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeTabTextActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    gap: 12,
    borderRadius: 20,
    padding: 18,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    color: colors.text.primary,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  listItem: {
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: 14,
    backgroundColor: colors.background.canvas,
  },
  itemName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.surface,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveButton: {
    borderRadius: 12,
    backgroundColor: colors.text.destructive,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  destructiveButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
