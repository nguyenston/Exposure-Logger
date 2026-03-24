import { useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated,
  Dimensions,
  Easing,
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

const ANIMATION_DURATION = 220;

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
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [optionsViewportHeight, setOptionsViewportHeight] = useState(0);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(48)).current;
  const { items, visibleItems, createItem, error, loading, rememberItem } = useGearRegistry(type, query);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setMounted(true);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();

      return;
    }

    if (!mounted) {
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 48,
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, mounted, open, sheetTranslateY]);

  const trimmedQuery = query.trim();
  const canQuickCreate = useMemo(
    () => trimmedQuery.length > 0 && !hasExactGearMatch(items, trimmedQuery),
    [items, trimmedQuery],
  );
  const sheetBottomOffset = keyboardOffset > 0
    ? Math.max(keyboardOffset - Math.max(insets.bottom, 0) - 4, 0)
    : 0;
  const topLimit = Math.max(insets.top + 16, 32);
  const optionsMaxHeight = keyboardOffset > 0 ? Math.min(windowHeight * 0.28, 240) : 320;
  const optionsMinHeight = keyboardOffset > 0 ? 120 : 220;
  const modalCardMaxHeight = keyboardOffset > 0
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
        onPress={() => setOpen(true)}
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
        animationType="none"
        navigationBarTranslucent
        statusBarTranslucent
        transparent
        visible={mounted}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={styles.modalRoot}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.modalBackdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.sheetContainer,
              {
                marginBottom: sheetBottomOffset,
                transform: [{ translateY: sheetTranslateY }],
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
                  onChangeText={setQuery}
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
                  contentContainerStyle={[
                    styles.options,
                    optionsViewportHeight > 0
                      ? {
                          minHeight: optionsViewportHeight + 24,
                        }
                      : null,
                  ]}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  onLayout={(event) => {
                    setOptionsViewportHeight(event.nativeEvent.layout.height);
                  }}
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
          </Animated.View>
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
    top: -160,
    bottom: -160,
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
