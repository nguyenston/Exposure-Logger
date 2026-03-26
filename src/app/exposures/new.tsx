import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
import { ExposureForm } from '@/features/exposures/exposure-form';
import { refineExposureLocation } from '@/features/exposures/refine-exposure-location';
import {
  buildExposureInitialValues,
  normalizeExposureForm,
} from '@/features/exposures/exposure-utils';
import type { ExposureFormValues } from '@/features/exposures/exposure-form';
import { useExposures } from '@/features/exposures/use-exposures';
import { useFocusedFieldVisibility } from '@/lib/use-focused-field-visibility';
import { useVolumeButtonTrigger } from '@/lib/use-volume-button-trigger';
import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';
import { useExposureFormDraftStore } from '@/store/exposure-form-draft-store';
import { colors } from '@/theme/colors';

export default function NewExposureScreen() {
  const { rollId, autoVoice } = useLocalSearchParams<{
    rollId?: string;
    autoVoice?: string;
  }>();
  const navigation = useNavigation();
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
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
  } = useExposureDefaultsSettings();
  const selectedRollId = typeof rollId === 'string' ? rollId : null;
  const draftKey = selectedRollId ? `new:${selectedRollId}` : null;
  const {
    exposures,
    latestExposure,
    loading: exposuresLoading,
    loadedRollId,
    createExposure,
    error: exposureError,
  } = useExposures(selectedRollId);
  const clearDraft = useExposureFormDraftStore((state) => state.clearDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [pendingInsertValues, setPendingInsertValues] = useState<ExposureFormValues | null>(null);
  const [selectedInsertFrame, setSelectedInsertFrame] = useState<number | null>(null);
  const [voiceHardwareToggleSignal, setVoiceHardwareToggleSignal] = useState(0);
  const [hardwareSubmitSignal, setHardwareSubmitSignal] = useState(0);

  const initialValues = useMemo(
    () => buildExposureInitialValues(latestExposure, settings),
    [latestExposure, settings],
  );
  const defaultSequenceNumber = useMemo(() => (latestExposure?.sequenceNumber ?? 0) + 1, [latestExposure]);
  const maxSequenceNumber = useMemo(
    () => exposures.reduce((highest, exposure) => Math.max(highest, exposure.sequenceNumber), 0),
    [exposures],
  );
  const insertFrameOptions = useMemo(
    () =>
      Array.from({ length: maxSequenceNumber + 1 }, (_, index) => {
        const nextFrame = index + 1;
        const existingExposure =
          exposures.find((exposure) => exposure.sequenceNumber === nextFrame) ?? null;

        return {
          frame: nextFrame,
          mode: existingExposure ? 'insert' : 'direct',
        } as const;
      }),
    [exposures, maxSequenceNumber],
  );
  const insertFrameLabels = useMemo(
    () => insertFrameOptions.map((option) => String(option.frame)),
    [insertFrameOptions],
  );
  const selectedInsertOption = useMemo(
    () =>
      insertFrameOptions.find((option) => option.frame === selectedInsertFrame) ??
      insertFrameOptions[0] ??
      null,
    [insertFrameOptions, selectedInsertFrame],
  );

  useEffect(() => {
    setPendingInsertValues(null);
    setSelectedInsertFrame(null);
  }, [selectedRollId]);

  useEffect(() => {
    if (!draftKey) {
      return;
    }

    return navigation.addListener('beforeRemove', () => {
      clearDraft(draftKey);
    });
  }, [clearDraft, draftKey, navigation]);

  useVolumeButtonTrigger(
    {
      onVolumeDown: () => {
        setHardwareSubmitSignal((current) => current + 1);
      },
      onVolumeUp: () => {
        setVoiceHardwareToggleSignal((current) => current + 1);
      },
    },
    {
      enabled: Boolean(selectedRollId) && !insertMenuOpen,
    },
  );

  const formLoading =
    selectedRollId !== null &&
    (settingsLoading || exposuresLoading || loadedRollId !== selectedRollId);

  const submitExposure = async (values: ExposureFormValues, nextSequenceNumber: number) => {
    const normalized = normalizeExposureForm(values);
    if (!normalized.fStop || !normalized.shutterSpeed || !normalized.capturedAt) {
      setSubmitError('F-stop, shutter speed, and captured time are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createExposure({
        rollId: selectedRollId!,
        sequenceNumber: nextSequenceNumber,
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
  };

  return (
    <>
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
        {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        {selectedRollId ? (
          formLoading ? (
            <Text style={styles.bodyText}>Loading exposure defaults...</Text>
          ) : (
            <ExposureForm
              autoStartVoice={autoVoice === '1'}
              autoFetchCurrentLocation={
                settings.defaultLocationEnabled && settings.defaultLocationToCurrent
              }
              draftKey={draftKey ?? undefined}
              error={exposureError}
              externalPrimarySubmitSignal={hardwareSubmitSignal}
              externalVoiceToggleSignal={voiceHardwareToggleSignal}
              initialValues={initialValues}
              secondarySubmitAction={{
                label: 'Insert',
                disabled: submitting,
                onPress: (values) => {
                  setPendingInsertValues(values);
                  setSelectedInsertFrame(defaultSequenceNumber);
                  setInsertMenuOpen(true);
                },
              }}
              onTextFieldBlur={handleFieldBlur}
              onTextFieldFocus={handleFieldFocus}
              onTextFieldLayout={registerFieldLayout}
              onSubmit={(values) => submitExposure(values, defaultSequenceNumber)}
              submitLabel="Add Exposure"
              submitting={submitting}
              stopStep={settings.exposureStopStep}
              voiceTranscriptApplyMode={settings.voiceTranscriptApplyMode}
            />
          )
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

      <Modal
        animationType="fade"
        transparent
        visible={insertMenuOpen}
        onRequestClose={() => {
          setInsertMenuOpen(false);
          setPendingInsertValues(null);
          setSelectedInsertFrame(null);
        }}
      >
        <Pressable
          accessibilityLabel="Close insert options"
          onPress={() => {
            setInsertMenuOpen(false);
            setPendingInsertValues(null);
            setSelectedInsertFrame(null);
          }}
          style={styles.overlay}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={styles.popup}
          >
            <Text style={styles.popupTitle}>Insert exposure</Text>
            <Text style={styles.popupBody}>
              Pick the target frame, then confirm the insert.
            </Text>
            {selectedInsertOption ? (
              <>
                <HorizontalRadioPicker
                  label="Frame"
                  getOptionTone={(value) => {
                    const parsed = Number.parseInt(value, 10);
                    const option = insertFrameOptions.find((candidate) => candidate.frame === parsed);
                    return option?.mode === 'direct' ? 'accent' : 'default';
                  }}
                  onChange={(value) => {
                    const parsed = Number.parseInt(value, 10);
                    if (Number.isInteger(parsed) && parsed > 0) {
                      setSelectedInsertFrame(parsed);
                    }
                  }}
                  options={insertFrameLabels}
                  value={String(selectedInsertOption.frame)}
                />
                <View
                  style={[
                    styles.insertModeCard,
                    selectedInsertOption.mode === 'insert'
                      ? styles.insertModeCardInsert
                      : styles.insertModeCardDirect,
                  ]}
                >
                  <Text
                    style={[
                      styles.insertModeTitle,
                      selectedInsertOption.mode === 'insert'
                        ? styles.insertModeTitleInsert
                        : styles.insertModeTitleDirect,
                    ]}
                  >
                    {selectedInsertOption.mode === 'insert'
                      ? `Insert at frame ${selectedInsertOption.frame}`
                      : `Place at frame ${selectedInsertOption.frame}`}
                  </Text>
                  <Text
                    style={[
                      styles.insertModeHint,
                      selectedInsertOption.mode === 'insert'
                        ? styles.insertModeHintInsert
                        : styles.insertModeHintDirect,
                    ]}
                  >
                    {selectedInsertOption.mode === 'insert'
                      ? 'This frame is already used, so later logged frames will shift forward.'
                      : 'This frame is unused, so the exposure will be placed here directly.'}
                  </Text>
                </View>
                <View style={styles.popupActions}>
                  <Pressable
                    onPress={() => {
                      setInsertMenuOpen(false);
                      setPendingInsertValues(null);
                      setSelectedInsertFrame(null);
                    }}
                    style={styles.popupSecondaryButton}
                  >
                    <Text style={styles.popupSecondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={!pendingInsertValues || submitting}
                    onPress={() => {
                      if (!pendingInsertValues) {
                        return;
                      }

                      setInsertMenuOpen(false);
                      void submitExposure(pendingInsertValues, selectedInsertOption.frame);
                      setPendingInsertValues(null);
                      setSelectedInsertFrame(null);
                    }}
                    style={[
                      styles.popupPrimaryButton,
                      !pendingInsertValues || submitting ? styles.popupButtonDisabled : null,
                    ]}
                  >
                    <Text style={styles.popupPrimaryButtonText}>Insert</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.overlay,
    padding: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 18,
  },
  popupTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  popupBody: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  insertModeCard: {
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  insertModeCardInsert: {
    borderColor: colors.text.primary,
    backgroundColor: colors.text.primary,
  },
  insertModeCardDirect: {
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
  },
  insertModeTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  insertModeTitleInsert: {
    color: colors.background.surface,
  },
  insertModeTitleDirect: {
    color: colors.text.primary,
  },
  insertModeHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  insertModeHintInsert: {
    color: colors.background.canvas,
  },
  insertModeHintDirect: {
    color: colors.text.secondary,
  },
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  popupSecondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  popupSecondaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  popupPrimaryButton: {
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  popupPrimaryButtonText: {
    color: colors.background.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  popupButtonDisabled: {
    opacity: 0.7,
  },
});
