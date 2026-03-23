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
const IDLE_SETTLE_DELAY_MS = 120;

export function HorizontalRadioPicker({
  label,
  options,
  value,
  onChange,
}: HorizontalRadioPickerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOffsetYRef = useRef(0);

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

  const commitOffset = (currentOffsetY: number) => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }

    lastOffsetYRef.current = currentOffsetY;
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
          onScroll={(event) => {
            lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
            if (settleTimeoutRef.current) {
              clearTimeout(settleTimeoutRef.current);
              settleTimeoutRef.current = null;
            }
            settleTimeoutRef.current = setTimeout(() => {
              commitOffset(lastOffsetYRef.current);
            }, IDLE_SETTLE_DELAY_MS);
          }}
          scrollEventThrottle={16}
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
                onPress={() => {
                  onChange(item);
                  scrollViewRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true,
                  });
                }}
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
