import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasExactGearMatch } from '@/features/gear/gear-utils';
import { useGearRegistry } from '@/features/gear/use-gear-registry';
import { useKeyboardOffset } from '@/lib/use-keyboard-offset';
import { colors } from '@/theme/colors';
import type { GearRegistryItem, GearType } from '@/types/domain';

type GearSelectorProps = {
  type: GearType;
  label: string;
  value: string | null;
  onChange: (item: GearRegistryItem) => void;
  placeholder: string;
  hideLabel?: boolean;
  compact?: boolean;
};

export function GearSelector({
  type,
  label,
  value,
  onChange,
  placeholder,
  hideLabel = false,
  compact = false,
}: GearSelectorProps) {
  const insets = useSafeAreaInsets();
  const keyboardOffset = useKeyboardOffset();
  const windowHeight = Dimensions.get('window').height;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const { items, visibleItems, createItem, error, loading, rememberItem } = useGearRegistry(type, query);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setInputFocused(false);
    }
  }, [open]);

  const effectiveKeyboardOffset = inputFocused ? keyboardOffset : 0;
  const trimmedQuery = query.trim();
  const canQuickCreate = useMemo(
    () => trimmedQuery.length > 0 && !hasExactGearMatch(items, trimmedQuery),
    [items, trimmedQuery],
  );
  const sheetBottomOffset = effectiveKeyboardOffset > 0
    ? Math.max(effectiveKeyboardOffset - Math.max(insets.bottom, 0) - 4, 0)
    : 0;
  const topLimit = Math.max(insets.top + 16, 32);
  const optionsMaxHeight = effectiveKeyboardOffset > 0 ? Math.min(windowHeight * 0.28, 240) : 320;
  const optionsMinHeight = effectiveKeyboardOffset > 0 ? 120 : 220;
  const modalCardMaxHeight = effectiveKeyboardOffset > 0
    ? Math.min(windowHeight * 0.82, windowHeight - sheetBottomOffset - topLimit)
    : windowHeight * 0.7;

  const handleSelect = (item: GearRegistryItem) => {
    rememberItem(item);
    onChange(item);
    setOpen(false);
  };

  const handleQuickCreate = async () => {
    try {
      const item = await createItem(query);
      onChange(item);
      setOpen(false);
    } catch {
      // keep UI stable; error text from hook remains visible
    }
  };

  const handleManageGear = () => {
    setOpen(false);
    router.push({
      pathname: '/gear',
      params: {
        type,
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      {!hideLabel ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[styles.trigger, compact ? styles.triggerCompact : null]}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[
            value ? styles.valueText : styles.placeholderText,
            compact ? styles.compactText : null,
          ]}
        >
          {value ?? placeholder}
        </Text>
      </Pressable>

      <Modal
        animationType="fade"
        navigationBarTranslucent
        statusBarTranslucent
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={styles.modalRoot}
        >
          <View
            pointerEvents="none"
            style={styles.modalBackdrop}
          />
          <View
            style={[
              styles.sheetContainer,
              {
                marginBottom: sheetBottomOffset,
              },
            ]}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.modalCard,
                {
                  maxHeight: modalCardMaxHeight,
                },
              ]}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{label}</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={() => setInputFocused(false)}
                  onChangeText={setQuery}
                  onFocus={() => setInputFocused(true)}
                  placeholder={`Search ${label.toLowerCase()}`}
                  placeholderTextColor={colors.text.muted}
                  style={styles.input}
                  value={query}
                />
                <Text style={styles.hintText}>
                  Type to search. If no exact match exists, you can create a new {label.toLowerCase()} from this field.
                </Text>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {loading ? <Text style={styles.metaText}>Loading gear...</Text> : null}
                {!loading && visibleItems.length === 0 ? (
                  <Text style={styles.metaText}>No matches yet.</Text>
                ) : null}

                <ScrollView
                  alwaysBounceVertical
                  bounces
                  contentContainerStyle={styles.options}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  overScrollMode="always"
                  style={[
                    styles.optionsScroll,
                    {
                      minHeight: optionsMinHeight,
                      maxHeight: optionsMaxHeight,
                    },
                  ]}
                >
                  {canQuickCreate ? (
                    <Pressable
                      onPress={handleQuickCreate}
                      style={styles.createButton}
                    >
                      <Text style={styles.createButtonLabel}>Create New {label}</Text>
                      <Text style={styles.createButtonValue}>{`"${trimmedQuery}"`}</Text>
                    </Pressable>
                  ) : null}

                  {visibleItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelect(item)}
                      style={[
                        styles.option,
                        value === item.name ? styles.optionSelected : null,
                      ]}
                    >
                      <Text style={styles.optionText}>{item.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View
                style={[
                  styles.footer,
                  {
                    paddingBottom: Math.max(insets.bottom, 12),
                  },
                ]}
              >
                <View style={styles.footerActions}>
                  <Pressable
                    onPress={handleManageGear}
                    style={styles.manageButton}
                  >
                    <Text style={styles.manageButtonText}>{`Manage ${label}`}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setOpen(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  trigger: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerCompact: {
    paddingVertical: 12,
  },
  valueText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  placeholderText: {
    color: colors.text.muted,
    fontSize: 16,
  },
  compactText: {
    fontSize: 14,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  sheetContainer: {
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalCard: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    gap: 12,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 22,
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
  options: {
    gap: 10,
    paddingBottom: 12,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.background.surface,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hintText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  option: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: colors.text.accent,
    backgroundColor: colors.background.surface,
  },
  optionText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  createButton: {
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createButtonLabel: {
    color: colors.background.surface,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.92,
  },
  createButtonValue: {
    color: colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  manageButton: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  manageButtonText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
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
