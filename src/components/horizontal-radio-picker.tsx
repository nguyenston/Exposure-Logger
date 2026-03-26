import { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

type HorizontalRadioPickerProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
  getOptionTone?: (value: string) => 'default' | 'accent';
};

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PICKER_DECELERATION_RATE = 0.985;
const SETTLE_EPSILON_PX = 1;
const MOMENTUM_VELOCITY_THRESHOLD = 0.05;

export function HorizontalRadioPicker({
  label,
  options,
  value,
  onChange,
  style,
  getOptionTone,
}: HorizontalRadioPickerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);

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

  const commitOffset = (currentOffsetY: number) => {
    const rawIndex = Math.round(currentOffsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(
      0,
      Math.min(
        options.length - 1,
        rawIndex,
      ),
    );
    const nextValue = options[clampedIndex];
    const snappedOffsetY = clampedIndex * ITEM_HEIGHT;

    if (nextValue !== value) {
      onChange(nextValue);
    }

    if (Math.abs(currentOffsetY - snappedOffsetY) > SETTLE_EPSILON_PX) {
      scrollViewRef.current?.scrollTo({
        y: snappedOffsetY,
        animated: false,
      });
    }
  };

  return (
    <View style={[styles.group, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerShell}>
        <View
          pointerEvents="none"
          style={styles.selectionBand}
        />
        <ScrollView
          decelerationRate={PICKER_DECELERATION_RATE}
          nestedScrollEnabled
          onMomentumScrollEnd={(event) => {
            commitOffset(event.nativeEvent.contentOffset.y);
          }}
          onScrollEndDrag={(event) => {
            const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);
            if (velocityY <= MOMENTUM_VELOCITY_THRESHOLD) {
              commitOffset(event.nativeEvent.contentOffset.y);
            }
          }}
          overScrollMode="never"
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          snapToOffsets={options.map((_, index) => index * ITEM_HEIGHT)}
          style={styles.list}
          contentContainerStyle={styles.content}
        >
          {options.map((item, index) => {
            const selected = index === selectedIndex;
            const tone = getOptionTone?.(item) ?? 'default';

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
                <Text
                  style={[
                    selected ? styles.optionTextSelected : styles.optionText,
                    tone === 'accent'
                      ? selected
                        ? styles.optionTextSelectedAccent
                        : styles.optionTextAccent
                      : null,
                  ]}
                >
                  {item}
                </Text>
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
    fontWeight: '700',
    opacity: 1,
  },
  optionTextSelected: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    opacity: 1,
  },
  optionTextAccent: {
    color: colors.text.muted,
    opacity: 0.45,
    fontWeight: '500',
  },
  optionTextSelectedAccent: {
    color: colors.text.muted,
    opacity: 0.55,
    fontWeight: '600',
  },
});
