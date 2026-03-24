import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { CrosshairIcon } from '@/components/crosshair-icon';
import { GearSelector } from '@/components/gear-selector';
import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
import { MicrophoneIcon } from '@/components/microphone-icon';
import { TrashIcon } from '@/components/trash-icon';
import { VoiceControlIcon } from '@/components/voice-control-icon';
import { getFStopOptions, getShutterSpeedOptions } from '@/features/exposures/stop-values';
import { useCurrentLocation } from '@/features/exposures/use-current-location';
import { useExposureVoiceInput } from '@/features/exposures/use-exposure-voice-input';
import { colors } from '@/theme/colors';
import type { ExposureStopStep } from '@/types/settings';

export type ExposureFormValues = {
  fStop: string;
  shutterSpeed: string;
  lens: string | null;
  capturedAt: string;
  notes: string;
  locationEnabled: boolean;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
};

type ExposureFormProps = {
  initialValues: ExposureFormValues;
  submitLabel: string;
  onSubmit: (values: ExposureFormValues) => Promise<void>;
  onDelete?: () => void;
  submitting?: boolean;
  error?: string | null;
  stopStep: ExposureStopStep;
  autoFetchCurrentLocation?: boolean;
  autoStartVoice?: boolean;
  onTextFieldLayout?: (fieldName: string, layout: { y: number; height: number }) => void;
  onTextFieldFocus?: (fieldName: string) => void;
  onTextFieldBlur?: (fieldName: string) => void;
};

function formatAccuracyLabel(value: string) {
  if (!value.trim()) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return `${Math.round(numeric)}m acc.`;
}

function formatLocationPreview(
  latitude: string,
  longitude: string,
) {
  if (!latitude.trim() || !longitude.trim()) {
    return null;
  }

  return `${latitude.trim()}, ${longitude.trim()}`;
}

function mergeNotes(existingNotes: string, nextNotes: string | null) {
  if (!nextNotes?.trim()) {
    return existingNotes;
  }

  const trimmedExisting = existingNotes.trim();
  const trimmedNext = nextNotes.trim();

  if (!trimmedExisting) {
    return trimmedNext;
  }

  if (trimmedExisting.includes(trimmedNext)) {
    return trimmedExisting;
  }

  return `${trimmedExisting}\n${trimmedNext}`;
}

function formatMatchedVoiceFields(fields: string[]) {
  return fields
    .map((field) => {
      switch (field) {
        case 'fStop':
          return 'f-stop';
        case 'shutterSpeed':
          return 'shutter speed';
        default:
          return field;
      }
    })
    .join(', ');
}

export function ExposureForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
  submitting = false,
  error,
  stopStep,
  autoFetchCurrentLocation = false,
  autoStartVoice = false,
  onTextFieldLayout,
  onTextFieldFocus,
  onTextFieldBlur,
}: ExposureFormProps) {
  const { width } = useWindowDimensions();
  const [values, setValues] = useState(initialValues);
  const fStopOptions = getFStopOptions(stopStep);
  const shutterSpeedOptions = getShutterSpeedOptions(stopStep);
  const {
    latestLocation,
    loading: locationLoading,
    error: locationError,
    version: locationVersion,
    clearError: clearLocationError,
    requestCurrentLocation,
  } = useCurrentLocation();
  const {
    available: voiceAvailable,
    error: voiceError,
    moduleReady: voiceModuleReady,
    parsedTranscript,
    startListening,
    state: voiceState,
    stopListening,
    cancelListening,
    clearTranscript,
    transcript,
  } = useExposureVoiceInput(stopStep);
  const [followLocationUpdates, setFollowLocationUpdates] = useState(autoFetchCurrentLocation);
  const [appliedLocationVersion, setAppliedLocationVersion] = useState(0);
  const [voiceAutoStarted, setVoiceAutoStarted] = useState(false);
  const [locationManualOverride, setLocationManualOverride] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    setLocationManualOverride(false);
  }, [initialValues]);

  useEffect(() => {
    if (
      !autoStartVoice ||
      voiceAutoStarted ||
      voiceState !== 'idle' ||
      submitting
    ) {
      return;
    }

    setVoiceAutoStarted(true);
    void startListening();
  }, [autoStartVoice, startListening, submitting, voiceAutoStarted, voiceState]);

  useEffect(() => {
    if (
      !autoFetchCurrentLocation ||
      values.latitude.trim() ||
      values.longitude.trim()
    ) {
      return;
    }

    clearLocationError();
    setFollowLocationUpdates(true);
    void requestCurrentLocation().catch(() => {
      // hook error is already surfaced
    });
  }, [
    autoFetchCurrentLocation,
    clearLocationError,
    requestCurrentLocation,
    values.latitude,
    values.longitude,
  ]);

  useEffect(() => {
    if (!followLocationUpdates || !latestLocation || appliedLocationVersion >= locationVersion) {
      return;
    }

    setValues((current) => ({
      ...current,
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      locationAccuracy: latestLocation.locationAccuracy,
    }));
    setAppliedLocationVersion(locationVersion);

    if (!locationLoading && latestLocation.source === 'current') {
      setFollowLocationUpdates(false);
    }
  }, [
    appliedLocationVersion,
    followLocationUpdates,
    latestLocation,
    locationLoading,
    locationVersion,
  ]);

  const locationAccuracyLabel = formatAccuracyLabel(values.locationAccuracy);
  const locationPreview = formatLocationPreview(
    values.latitude,
    values.longitude,
  );
  const useDualPickerRow = width >= 400;
  let locationStatusText: string | null = null;

  if (locationError) {
    locationStatusText = locationError;
  } else if (locationLoading && latestLocation?.source === 'last_known') {
    locationStatusText = locationAccuracyLabel
      ? `Using last known location for now (${locationAccuracyLabel}) while GPS refines.`
      : 'Using last known location for now while GPS refines.';
  } else if (locationLoading) {
    locationStatusText = 'Fetching current GPS location...';
  } else if (latestLocation?.source === 'current') {
    locationStatusText = locationAccuracyLabel
      ? `Current GPS locked (${locationAccuracyLabel}).`
      : 'Current GPS locked.';
  } else if (latestLocation?.source === 'last_known') {
    locationStatusText = locationAccuracyLabel
      ? `Using last known location (${locationAccuracyLabel}).`
      : 'Using last known location.';
  }

  return (
    <View style={styles.form}>
      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <View style={styles.voiceCopy}>
            <Text style={styles.label}>Voice Input</Text>
            <Text style={styles.hint}>
              Say something like “f stop 2.8 at 60 lens 50mm notes storefront at dusk”.
            </Text>
          </View>
          {voiceState === 'listening' || voiceState === 'starting' || voiceState === 'processing' ? (
            <Pressable
              accessibilityLabel="Stop voice recording"
              onPress={() => stopListening()}
              style={[styles.voiceButton, styles.voiceButtonActive]}
            >
              <VoiceControlIcon variant="stop" size={20} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityLabel="Start voice recording"
              onPress={() => void startListening()}
              style={styles.voiceButton}
            >
              <MicrophoneIcon size={20} />
            </Pressable>
          )}
        </View>

        {!voiceModuleReady || voiceAvailable ? null : (
          <Text style={styles.voiceStatusText}>
            Voice input needs a rebuilt native app after adding speech recognition.
          </Text>
        )}
        {voiceError ? <Text style={styles.errorText}>{voiceError}</Text> : null}

        {transcript ? (
          <View style={styles.voiceResult}>
            <Text style={styles.voiceResultLabel}>Transcript</Text>
            <Text style={styles.voiceTranscript}>{transcript}</Text>

            {parsedTranscript.matchedFields.length > 0 ? (
              <Text style={styles.voiceStatusText}>
                Parsed {formatMatchedVoiceFields(parsedTranscript.matchedFields)}.
              </Text>
            ) : (
              <Text style={styles.voiceStatusText}>
                No exposure fields were recognized yet. Use explicit words like “f stop”, “at”, “lens”, and “notes”.
              </Text>
            )}

            <View style={styles.voiceActions}>
              <Pressable
                onPress={() => {
                  setValues((current) => ({
                    ...current,
                    fStop: parsedTranscript.fStop ?? current.fStop,
                    shutterSpeed: parsedTranscript.shutterSpeed ?? current.shutterSpeed,
                    lens: parsedTranscript.lens ?? current.lens,
                    notes: mergeNotes(current.notes, parsedTranscript.notes),
                  }));
                  clearTranscript();
                }}
                style={[
                  styles.primaryButton,
                  parsedTranscript.matchedFields.length === 0 ? styles.primaryButtonDisabled : null,
                ]}
                disabled={parsedTranscript.matchedFields.length === 0}
              >
                <Text style={styles.primaryButtonText}>Apply Transcript</Text>
              </Pressable>
              <Pressable
                onPress={() => cancelListening()}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.pickerRow, useDualPickerRow ? styles.pickerRowWide : null]}>
        <HorizontalRadioPicker
          label={`F-Stop (${stopStep} stop)`}
          onChange={(fStop) => setValues((current) => ({ ...current, fStop }))}
          options={fStopOptions}
          style={useDualPickerRow ? styles.pickerColumn : null}
          value={values.fStop}
        />

        <HorizontalRadioPicker
          label={`Shutter (${stopStep} stop)`}
          onChange={(shutterSpeed) => setValues((current) => ({ ...current, shutterSpeed }))}
          options={shutterSpeedOptions}
          style={useDualPickerRow ? styles.pickerColumn : null}
          value={values.shutterSpeed}
        />
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Lens</Text>
        <View style={styles.inlineFieldControl}>
          <GearSelector
            compact
            hideLabel
            label="Lens"
            onChange={(item) => setValues((current) => ({ ...current, lens: item.name }))}
            placeholder="Select or create a lens"
            type="lens"
            value={values.lens}
          />
        </View>
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Captured</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(capturedAt) => setValues((current) => ({ ...current, capturedAt }))}
          onBlur={() => onTextFieldBlur?.('capturedAt')}
          onFocus={() => onTextFieldFocus?.('capturedAt')}
          onLayout={(event) =>
            onTextFieldLayout?.('capturedAt', {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          placeholder="ISO timestamp"
          placeholderTextColor={colors.text.muted}
          style={[styles.input, styles.inlineFieldInput]}
          value={values.capturedAt}
        />
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Notes</Text>
        <TextInput
          multiline
          onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
          onBlur={() => onTextFieldBlur?.('notes')}
          onFocus={() => onTextFieldFocus?.('notes')}
          onLayout={(event) =>
            onTextFieldLayout?.('notes', {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          placeholder="Any frame-specific notes"
          placeholderTextColor={colors.text.muted}
          style={[styles.input, styles.inlineFieldInput, styles.notesInput]}
          textAlignVertical="top"
          value={values.notes}
        />
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Location</Text>
        <View style={styles.inlineFieldControl}>
          <View style={styles.locationFields}>
            <Pressable
              accessibilityLabel={locationManualOverride ? 'Hide manual location fields' : 'Show manual location fields'}
              onPress={() => {
                setLocationManualOverride((current) => !current);
                if (!locationManualOverride) {
                  setFollowLocationUpdates(false);
                }
              }}
              style={({ pressed }) => [
                styles.locationSummaryCard,
                pressed ? styles.locationSummaryCardPressed : null,
              ]}
            >
              <View style={styles.locationHeader}>
                <View style={styles.locationTextColumn}>
                  {locationPreview ? (
                    <Text style={styles.locationPreview}>{locationPreview}</Text>
                  ) : (
                    <Text style={styles.locationEmptyText}>Not set</Text>
                  )}
                  {locationStatusText ? <Text style={styles.locationStatusText}>{locationStatusText}</Text> : null}
                </View>
                <Pressable
                  accessibilityLabel="Use current location"
                  disabled={locationLoading}
                  hitSlop={8}
                  onPress={(event) => {
                    event.stopPropagation();
                    clearLocationError();
                    setFollowLocationUpdates(true);
                    void requestCurrentLocation().catch(() => {
                      // hook error is surfaced by the hook
                    });
                  }}
                  style={[
                    styles.locationIconButton,
                    locationLoading ? styles.locationIconButtonDisabled : null,
                  ]}
                >
                  <CrosshairIcon />
                </Pressable>
              </View>
            </Pressable>
            {locationManualOverride ? (
              <View style={styles.manualLocationFields}>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="decimal-pad"
                  onChangeText={(latitude) => {
                    setFollowLocationUpdates(false);
                    setValues((current) => ({ ...current, latitude }));
                  }}
                  onBlur={() => onTextFieldBlur?.('latitude')}
                  onFocus={() => onTextFieldFocus?.('latitude')}
                  onLayout={(event) =>
                    onTextFieldLayout?.('latitude', {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height,
                    })
                  }
                  placeholder="Latitude"
                  placeholderTextColor={colors.text.muted}
                  style={[styles.input, styles.manualLocationInput]}
                  value={values.latitude}
                />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="decimal-pad"
                  onChangeText={(longitude) => {
                    setFollowLocationUpdates(false);
                    setValues((current) => ({ ...current, longitude }));
                  }}
                  onBlur={() => onTextFieldBlur?.('longitude')}
                  onFocus={() => onTextFieldFocus?.('longitude')}
                  onLayout={(event) =>
                    onTextFieldLayout?.('longitude', {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height,
                    })
                  }
                  placeholder="Longitude"
                  placeholderTextColor={colors.text.muted}
                  style={[styles.input, styles.manualLocationInput]}
                  value={values.longitude}
                />
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="decimal-pad"
                  onChangeText={(locationAccuracy) => {
                    setFollowLocationUpdates(false);
                    setValues((current) => ({ ...current, locationAccuracy }));
                  }}
                  onBlur={() => onTextFieldBlur?.('locationAccuracy')}
                  onFocus={() => onTextFieldFocus?.('locationAccuracy')}
                  onLayout={(event) =>
                    onTextFieldLayout?.('locationAccuracy', {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height,
                    })
                  }
                  placeholder="Accuracy in meters"
                  placeholderTextColor={colors.text.muted}
                  style={[styles.input, styles.manualLocationInput]}
                  value={values.locationAccuracy}
                />
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        <View style={styles.leadingActions}>
          {onDelete ? (
            <Pressable
              accessibilityLabel="Delete exposure"
              onPress={onDelete}
              style={styles.destructiveIconButton}
            >
              <TrashIcon />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          disabled={submitting}
          onPress={() => void onSubmit(values)}
          style={[styles.primaryButton, submitting ? styles.primaryButtonDisabled : null]}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : submitLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  pickerRow: {
    gap: 16,
  },
  pickerRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pickerColumn: {
    flex: 1,
    minWidth: 0,
  },
  group: {
    gap: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  inlineFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineFieldRowTop: {
    alignItems: 'flex-start',
  },
  inlineFieldLabel: {
    width: 74,
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineFieldControl: {
    flex: 1,
  },
  inlineFieldInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 84,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  locationFields: {
    gap: 10,
  },
  locationSummaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 14,
  },
  locationSummaryCardPressed: {
    borderColor: colors.text.accent,
    backgroundColor: colors.background.canvas,
  },
  voiceCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  voiceCopy: {
    flex: 1,
    gap: 4,
  },
  voiceButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.text.accent,
  },
  voiceButtonActive: {
    backgroundColor: colors.text.primary,
  },
  voiceResult: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 10,
  },
  voiceResultLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  voiceTranscript: {
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 21,
  },
  voiceStatusText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  voiceActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
  },
  locationIconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.accent,
  },
  locationIconButtonDisabled: {
    opacity: 0.7,
  },
  locationTextColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  locationStatusText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  locationPreview: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  locationEmptyText: {
    color: colors.text.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  manualLocationFields: {
    gap: 10,
  },
  manualLocationInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
  },
  leadingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.background.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  destructiveIconButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.destructive,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});

