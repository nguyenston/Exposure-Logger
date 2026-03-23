import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RollForm } from '@/features/rolls/roll-form';
import { useKeyboardOffset } from '@/lib/use-keyboard-offset';
import { useRolls } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';

export default function NewRollScreen() {
  const insets = useSafeAreaInsets();
  const keyboardOffset = useKeyboardOffset();
  const { createRoll, error } = useRolls();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [notesFocused, setNotesFocused] = useState(false);
  const [notesLayout, setNotesLayout] = useState({ y: 0, height: 0 });
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollYRef = useRef(0);
  const bottomBarHeight = Math.max(insets.bottom, 14);

  useEffect(() => {
    if (notesFocused && keyboardOffset > 0) {
      const visibleBottom = scrollYRef.current + viewportHeight - keyboardOffset - bottomBarHeight - 12;
      const notesBottom = notesLayout.y + notesLayout.height + 16;

      if (notesBottom > visibleBottom) {
        scrollViewRef.current?.scrollTo({
          y: scrollYRef.current + (notesBottom - visibleBottom),
          animated: true,
        });
      }
    }
  }, [bottomBarHeight, keyboardOffset, notesFocused, notesLayout, viewportHeight]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = event.nativeEvent.contentOffset.y;
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + Math.max(keyboardOffset - insets.bottom, 0),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <Text style={styles.heading}>New Roll</Text>
        <Text style={styles.subheading}>
          Create a roll with camera, film stock, and ISO details. New rolls start as active.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <RollForm
          showStatus={false}
          onNotesLayout={setNotesLayout}
          onNotesBlur={() => setNotesFocused(false)}
          onNotesFocus={() => setNotesFocused(true)}
          onCancel={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/rolls');
            }
          }}
          submitLabel="Create Roll"
          onSubmit={async (values) => {
            const created = await createRoll({
              ...values,
              status: 'active',
              finishedAt: null,
            });
            router.replace(`/rolls/${created.id}`);
          }}
        />
      </ScrollView>
      <View
        style={[
          styles.bottomBar,
          {
            height: bottomBarHeight,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  scrollView: {
    flex: 1,
  },
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
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
  bottomBar: {
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    shadowColor: colors.text.primary,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    elevation: 10,
  },
});
