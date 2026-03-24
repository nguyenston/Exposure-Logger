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
};

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PICKER_DECELERATION_RATE = 0.95;
const SETTLE_EPSILON_PX = 2;
const SELECTION_DEADBAND_RATIO = 0.18;
const MOMENTUM_VELOCITY_THRESHOLD = 0.05;

export function HorizontalRadioPicker({
  label,
  options,
  value,
  onChange,
  style,
}: HorizontalRadioPickerProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const lastOffsetYRef = useRef(0);
  const settlingTargetYRef = useRef<number | null>(null);
  const momentumActiveRef = useRef(false);

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
    return () => undefined;
  }, []);

  const commitOffset = (currentOffsetY: number) => {
    lastOffsetYRef.current = currentOffsetY;
    const currentIndexTargetY = selectedIndex * ITEM_HEIGHT;
    const distanceFromCurrent = currentOffsetY - currentIndexTargetY;
    const deadband = ITEM_HEIGHT * SELECTION_DEADBAND_RATIO;
    const rawIndex = Math.round(currentOffsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(
      0,
      Math.min(
        options.length - 1,
        Math.abs(distanceFromCurrent) <= deadband ? selectedIndex : rawIndex,
      ),
    );
    const nextValue = options[clampedIndex];
    const targetOffsetY = clampedIndex * ITEM_HEIGHT;

    if (nextValue !== value) {
      onChange(nextValue);
    }

    if (Math.abs(targetOffsetY - currentOffsetY) > SETTLE_EPSILON_PX) {
      settlingTargetYRef.current = targetOffsetY;
      scrollViewRef.current?.scrollTo({
        y: targetOffsetY,
        animated: true,
      });
    } else {
      settlingTargetYRef.current = null;
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
          onMomentumScrollBegin={() => {
            momentumActiveRef.current = true;
          }}
          onMomentumScrollEnd={(event) => {
            momentumActiveRef.current = false;
            commitOffset(event.nativeEvent.contentOffset.y);
          }}
          onScroll={(event) => {
            lastOffsetYRef.current = event.nativeEvent.contentOffset.y;

            if (settlingTargetYRef.current !== null) {
              if (
                Math.abs(lastOffsetYRef.current - settlingTargetYRef.current) <= SETTLE_EPSILON_PX
              ) {
                settlingTargetYRef.current = null;
              } else {
                return;
              }
            }
          }}
          onScrollBeginDrag={() => {
            settlingTargetYRef.current = null;
            momentumActiveRef.current = false;
          }}
          onScrollEndDrag={(event) => {
            const velocityY = Math.abs(event.nativeEvent.velocity?.y ?? 0);
            if (!momentumActiveRef.current && velocityY <= MOMENTUM_VELOCITY_THRESHOLD) {
              commitOffset(event.nativeEvent.contentOffset.y);
            }
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
