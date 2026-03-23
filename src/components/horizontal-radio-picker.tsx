import { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors } from '@/theme/colors';

type HorizontalRadioPickerProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const SNAP_VELOCITY_THRESHOLD = 0.35;
const DRAG_SETTLE_DELAY_MS = 80;

export function HorizontalRadioPicker({
  label,
  options,
  value,
  onChange,
}: HorizontalRadioPickerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const momentumActiveRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = useMemo(() => {
    const index = options.indexOf(value);
    return index >= 0 ? index : 0;
  }, [options, value]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  useEffect(() => {
    return () => {
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  const commitOffset = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }

    const currentOffsetY = event.nativeEvent.contentOffset.y;
    const rawIndex = Math.round(currentOffsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(options.length - 1, rawIndex));
    const nextValue = options[clampedIndex];
    const targetOffsetY = clampedIndex * ITEM_HEIGHT;

    if (nextValue !== value) {
      onChange(nextValue);
    }

    if (Math.abs(targetOffsetY - currentOffsetY) > 2) {
      scrollViewRef.current?.scrollTo({
        y: targetOffsetY,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerShell}>
        <View
          pointerEvents="none"
          style={styles.selectionBand}
        />
        <ScrollView
          decelerationRate="normal"
          nestedScrollEnabled
          onScrollBeginDrag={() => {
            momentumActiveRef.current = false;
            if (settleTimeoutRef.current) {
              clearTimeout(settleTimeoutRef.current);
              settleTimeoutRef.current = null;
            }
          }}
          onMomentumScrollBegin={() => {
            momentumActiveRef.current = true;
            if (settleTimeoutRef.current) {
              clearTimeout(settleTimeoutRef.current);
              settleTimeoutRef.current = null;
            }
          }}
          onMomentumScrollEnd={(event) => {
            momentumActiveRef.current = false;
            commitOffset(event);
          }}
          onScrollEndDrag={(event) => {
            const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);

            if (velocityY > SNAP_VELOCITY_THRESHOLD) {
              return;
            }

            settleTimeoutRef.current = setTimeout(() => {
              if (!momentumActiveRef.current) {
                commitOffset(event);
              }
            }, DRAG_SETTLE_DELAY_MS);
          }}
          overScrollMode="never"
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.content}
        >
          {options.map((item, index) => {
            const selected = index === selectedIndex;

            return (
              <Pressable
                key={item}
                onPress={() => onChange(item)}
                style={styles.option}
              >
                <Text style={selected ? styles.optionTextSelected : styles.optionText}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickerShell: {
    height: PICKER_HEIGHT,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  selectionBand: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    opacity: 0.14,
    zIndex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingVertical: ITEM_HEIGHT,
  },
  option: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  optionText: {
    color: colors.text.secondary,
    fontSize: 17,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
