import { useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExposureForm } from '@/features/exposures/exposure-form';
import { refineExposureLocation } from '@/features/exposures/refine-exposure-location';
import {
  buildExposureInitialValues,
  normalizeExposureForm,
} from '@/features/exposures/exposure-utils';
import { useExposures } from '@/features/exposures/use-exposures';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { useRolls } from '@/features/rolls/use-rolls';
import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';
import { useExposureFormDraftStore } from '@/store/exposure-form-draft-store';
import { colors } from '@/theme/colors';

export default function NewExposureScreen() {
  const { rollId, autoVoice } = useLocalSearchParams<{ rollId?: string; autoVoice?: string }>();
  const insets = useSafeAreaInsets();
  const {
    handleFieldBlur,
    handleFieldFocus,
    handleScroll,
    handleViewportLayout,
    keyboardOffset,
    registerFieldLayout,
    scrollViewRef,
  } = useFocusedFieldVisibility();
  const { rolls, error: rollError } = useRolls();
  const { settings, error: settingsError } = useExposureDefaultsSettings();
  const selectedRoll = rolls.find((candidate) => candidate.id === rollId) ?? null;
  const selectedRollId = selectedRoll?.id ?? null;
  const { latestExposure, createExposure, error: exposureError } = useExposures(selectedRollId);
  const clearDraft = useExposureFormDraftStore((state) => state.clearDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const draftKey = selectedRollId ? `new:${selectedRollId}` : null;

  const initialValues = useMemo(
    () => buildExposureInitialValues(latestExposure, settings),
    [latestExposure, settings],
  );

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
      {rollError ? <Text style={styles.errorText}>{rollError}</Text> : null}
      {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      {selectedRollId ? (
        <ExposureForm
          autoStartVoice={autoVoice === '1'}
          autoFetchCurrentLocation={
            settings.defaultLocationEnabled && settings.defaultLocationToCurrent
          }
          draftKey={draftKey ?? undefined}
          error={exposureError}
          initialValues={initialValues}
          onTextFieldBlur={handleFieldBlur}
          onTextFieldFocus={handleFieldFocus}
          onTextFieldLayout={registerFieldLayout}
          onSubmit={async (values) => {
            const normalized = normalizeExposureForm(values);
            if (!normalized.fStop || !normalized.shutterSpeed || !normalized.capturedAt) {
              setSubmitError('F-stop, shutter speed, and captured time are required.');
              return;
            }

            setSubmitting(true);
            setSubmitError(null);

            try {
              const created = await createExposure({
                rollId: selectedRollId,
                ...normalized,
              });
              if (draftKey) {
                clearDraft(draftKey);
              }
              if (settings.defaultLocationEnabled && settings.defaultLocationToCurrent) {
                void refineExposureLocation(created.id);
              }
              router.replace(`/rolls/${selectedRollId}`);
            } catch (err) {
              setSubmitError(err instanceof Error ? err.message : 'Failed to create exposure.');
            } finally {
              setSubmitting(false);
            }
          }}
          submitLabel="Add Exposure"
          submitting={submitting}
          stopStep={settings.exposureStopStep}
          voiceTranscriptApplyMode={settings.voiceTranscriptApplyMode}
        />
      ) : (
        <>
          <Text style={styles.bodyText}>Choose a roll before logging an exposure.</Text>
          <Link
            href="/"
            style={styles.createRollLink}
          >
            Back to Current Roll
          </Link>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  bodyText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  createRollLink: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
