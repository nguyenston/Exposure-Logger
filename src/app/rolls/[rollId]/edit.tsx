import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RollForm } from '@/features/rolls/roll-form';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { useRoll, useRolls } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';

export default function EditRollScreen() {
  const insets = useSafeAreaInsets();
  const { rollId } = useLocalSearchParams<{ rollId: string }>();
  const { roll, loading, error } = useRoll(rollId);
  const { updateRoll, deleteRoll } = useRolls();
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

  const contentContainerStyle = [
    styles.container,
    {
      paddingBottom: 24 + Math.max(keyboardOffset - insets.bottom, 0),
    },
  ];

  const bottomBarStyle = [
    styles.bottomBar,
    {
      height: bottomBarHeight,
    },
  ];

  if (loading) {
    return (
      <View style={styles.screen}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          onLayout={handleViewportLayout}
          onScroll={handleScroll}
          ref={scrollViewRef}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          <Text style={styles.subheading}>Loading roll...</Text>
        </ScrollView>
        <View style={bottomBarStyle} />
      </View>
    );
  }

  if (!roll) {
    return (
      <View style={styles.screen}>
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          onLayout={handleViewportLayout}
          onScroll={handleScroll}
          ref={scrollViewRef}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          <Text style={styles.errorText}>{error ?? 'Roll not found.'}</Text>
        </ScrollView>
        <View style={bottomBarStyle} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <RollForm
          initialRoll={roll}
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
          onDelete={async () => {
            await deleteRoll(roll.id);
            router.replace('/rolls');
          }}
          onSubmit={async (values) => {
            const updated = await updateRoll(roll.id, values);
            router.replace(`/rolls/${updated.id}`);
          }}
          submitLabel="Save Changes"
        />
      </ScrollView>
      <View style={bottomBarStyle} />
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
