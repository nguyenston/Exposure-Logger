import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExposureForm } from '@/features/exposures/exposure-form';
import {
  buildExposureEditValues,
  normalizeExposureForm,
} from '@/features/exposures/exposure-utils';
import { useExposure, useExposures } from '@/features/exposures/use-exposures';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';
import { colors } from '@/theme/colors';

export default function EditExposureScreen() {
  const { exposureId } = useLocalSearchParams<{ exposureId: string }>();
  const insets = useSafeAreaInsets();
  const { exposure, loading, error } = useExposure(exposureId ?? null);
  const { updateExposure, deleteExposure } = useExposures(exposure?.rollId ?? null);
  const { settings } = useExposureDefaultsSettings();
  const {
    handleFieldBlur,
    handleFieldFocus,
    handleScroll,
    handleViewportLayout,
    keyboardOffset,
    registerFieldLayout,
    scrollViewRef,
  } = useFocusedFieldVisibility();

  if (loading) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom + Math.max(keyboardOffset - insets.bottom, 0),
          },
        ]}
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
      >
        <Text style={styles.meta}>Loading exposure...</Text>
      </ScrollView>
    );
  }

  if (!exposure) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom + Math.max(keyboardOffset - insets.bottom, 0),
          },
        ]}
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        ref={scrollViewRef}
        scrollEventThrottle={16}
      >
        <Text style={styles.errorText}>{error ?? 'Exposure not found.'}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom + Math.max(keyboardOffset - insets.bottom, 0),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      onLayout={handleViewportLayout}
      onScroll={handleScroll}
      ref={scrollViewRef}
      scrollEventThrottle={16}
    >
      <Text style={styles.heading}>Edit Exposure #{exposure.sequenceNumber}</Text>
      <Text style={styles.meta}>Adjust exposure metadata or remove the frame entirely.</Text>

      <ExposureForm
        initialValues={buildExposureEditValues(exposure)}
        onTextFieldBlur={handleFieldBlur}
        onTextFieldFocus={handleFieldFocus}
        onTextFieldLayout={registerFieldLayout}
        onCancel={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(`/rolls/${exposure.rollId}`);
          }
        }}
        onSubmit={async (values) => {
          const normalized = normalizeExposureForm(values);
          await updateExposure(exposure.id, normalized);
          router.replace(`/rolls/${exposure.rollId}`);
        }}
        submitLabel="Save Exposure"
        stopStep={settings.exposureStopStep}
      />

      <Text
        onPress={() => {
          Alert.alert(
            'Delete exposure?',
            'This will permanently delete this exposure.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  void deleteExposure(exposure.id).then(() => {
                    router.replace(`/rolls/${exposure.rollId}`);
                  });
                },
              },
            ],
          );
        }}
        style={styles.deleteLink}
      >
        Delete Exposure
      </Text>
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
  meta: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
  deleteLink: {
    color: colors.text.destructive,
    fontSize: 15,
    fontWeight: '700',
  },
});
