import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RollForm } from '@/features/rolls/roll-form';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { useRolls } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';

export default function NewRollScreen() {
  const insets = useSafeAreaInsets();
  const { createRoll, error, rolls } = useRolls();
  const bottomBarHeight = Math.max(insets.bottom, 14);
  const {
    handleFieldBlur,
    handleFieldFocus,
    handleScroll,
    handleViewportLayout,
    keyboardOffset,
    registerFieldLayout,
    scrollViewRef,
  } = useFocusedFieldVisibility({ bottomInset: bottomBarHeight });

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
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <RollForm
          existingRolls={rolls}
          showStatus={false}
          onTextFieldLayout={registerFieldLayout}
          onTextFieldBlur={handleFieldBlur}
          onTextFieldFocus={handleFieldFocus}
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
