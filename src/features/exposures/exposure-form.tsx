import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { CrosshairIcon } from '@/components/crosshair-icon';
import { GearSelector } from '@/components/gear-selector';
import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
import { MicrophoneIcon } from '@/components/microphone-icon';
import { TrashIcon } from '@/components/trash-icon';
import { VoiceControlIcon } from '@/components/voice-control-icon';
import { resolveBestGearMatch } from '@/features/gear/gear-utils';
import { useGearRegistry } from '@/features/gear/use-gear-registry';
import { getFStopOptions, getShutterSpeedOptions } from '@/features/exposures/stop-values';
import { useCurrentLocation } from '@/features/exposures/use-current-location';
import { useExposureVoiceInput } from '@/features/exposures/use-exposure-voice-input';
import { useExposureFormDraftStore } from '@/store/exposure-form-draft-store';
import { colors } from '@/theme/colors';
import type { ExposureStopStep, VoiceTranscriptApplyMode } from '@/types/settings';

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
  voiceTranscriptApplyMode?: VoiceTranscriptApplyMode;
  autoFetchCurrentLocation?: boolean;
  autoStartVoice?: boolean;
  onTextFieldLayout?: (fieldName: string, layout: { y: number; height: number }) => void;
  onTextFieldFocus?: (fieldName: string) => void;
  onTextFieldBlur?: (fieldName: string) => void;
  draftKey?: string;
  externalVoiceToggleSignal?: number;
  externalPrimarySubmitSignal?: number;
  secondarySubmitAction?: {
    label: string;
    onPress: (values: ExposureFormValues) => void;
    disabled?: boolean;
  };
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

function applyParsedTranscriptToValues(
  current: ExposureFormValues,
  parsedTranscript: {
    fStop: string | null;
    shutterSpeed: string | null;
    lens: string | null;
    notes: string | null;
    notesMode: 'append' | 'replace';
  },
  resolvedLensName: string | null,
) {
  return {
    ...current,
    fStop: parsedTranscript.fStop ?? current.fStop,
    shutterSpeed: parsedTranscript.shutterSpeed ?? current.shutterSpeed,
    lens: resolvedLensName ?? current.lens,
    notes:
      parsedTranscript.notes === null
        ? current.notes
        : parsedTranscript.notesMode === 'replace'
          ? parsedTranscript.notes
          : mergeNotes(current.notes, parsedTranscript.notes),
  };
}

function formatAutoApplySummary(parsedTranscript: {
  matchedFields: string[];
  fStop: string | null;
  shutterSpeed: string | null;
}) {
  const parts: string[] = [];

  if (parsedTranscript.fStop) {
    parts.push(`f-stop ${parsedTranscript.fStop}`);
  }
  if (parsedTranscript.shutterSpeed) {
    parts.push(`shutter ${parsedTranscript.shutterSpeed}`);
  }
  if (parsedTranscript.matchedFields.includes('lens')) {
    parts.push('lens');
  }
  if (parsedTranscript.matchedFields.includes('notes')) {
    parts.push('notes');
  }

  return parts.length > 0 ? `Applied ${parts.join(', ')}.` : null;
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

function parseCapturedAtValue(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatCapturedAtValue(value: string) {
  const parsed = parseCapturedAtValue(value);
  if (!parsed) {
    return {
      date: 'Not set',
      time: '',
    };
  }

  return {
    date: parsed.toLocaleDateString([], {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }),
    time: parsed.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

function applyDatePart(baseValue: string, selectedDate: Date) {
  const nextValue = parseCapturedAtValue(baseValue) ?? new Date();
  nextValue.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  return nextValue.toISOString();
}

function applyTimePart(baseValue: string, selectedDate: Date) {
  const nextValue = parseCapturedAtValue(baseValue) ?? new Date();
  nextValue.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
  return nextValue.toISOString();
}

function areFormValuesEqual(left: ExposureFormValues, right: ExposureFormValues) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function ExposureForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
  submitting = false,
  error,
  stopStep,
  voiceTranscriptApplyMode = 'auto_apply',
  autoFetchCurrentLocation = false,
  autoStartVoice = false,
  onTextFieldLayout,
  onTextFieldFocus,
  onTextFieldBlur,
  draftKey,
  externalVoiceToggleSignal,
  externalPrimarySubmitSignal,
  secondarySubmitAction,
}: ExposureFormProps) {
  const { width } = useWindowDimensions();
  const draftValues = useExposureFormDraftStore((state) =>
    draftKey ? state.drafts[draftKey]?.values ?? null : null,
  );
  const clearDraftValues = useExposureFormDraftStore((state) => state.clearDraftValues);
  const setDraftValues = useExposureFormDraftStore((state) => state.setDraftValues);
  const [values, setValues] = useState(() => draftValues ?? initialValues);
  const previousDraftKeyRef = useRef(draftKey);
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
  const { items: lensItems } = useGearRegistry('lens');
  const [followLocationUpdates, setFollowLocationUpdates] = useState(autoFetchCurrentLocation);
  const [appliedLocationVersion, setAppliedLocationVersion] = useState(0);
  const [voiceAutoStarted, setVoiceAutoStarted] = useState(false);
  const [locationManualOverride, setLocationManualOverride] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [activeTimestampPicker, setActiveTimestampPicker] = useState<'date' | 'time' | null>(null);
  const previousExternalVoiceToggleSignalRef = useRef<number | undefined>(undefined);
  const previousExternalPrimarySubmitSignalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousDraftKeyRef.current === draftKey) {
      return;
    }

    previousDraftKeyRef.current = draftKey;
    setValues(draftValues ?? initialValues);
  }, [draftKey, draftValues, initialValues]);

  useEffect(() => {
    setVoiceFeedback(null);
  }, [draftKey]);

  useEffect(() => {
    if (voiceState === 'starting' || voiceState === 'listening') {
      setVoiceFeedback(null);
    }
  }, [voiceState]);

  useEffect(() => {
    setLocationManualOverride(false);
  }, [draftKey]);

  useEffect(() => {
    setActiveTimestampPicker(null);
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) {
      return;
    }

    if (areFormValuesEqual(values, initialValues)) {
      clearDraftValues(draftKey);
      return;
    }

    setDraftValues(draftKey, values);
  }, [clearDraftValues, draftKey, initialValues, setDraftValues, values]);

  const updateValues = useCallback(
    (updater: ExposureFormValues | ((current: ExposureFormValues) => ExposureFormValues)) => {
      setValues((current) => (typeof updater === 'function' ? updater(current) : updater));
    },
    [],
  );

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

    updateValues((current) => ({
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
    updateValues,
  ]);

  const resolvedTranscriptLensName =
    parsedTranscript.lens === null
      ? null
      : resolveBestGearMatch(lensItems, parsedTranscript.lens)?.name ?? parsedTranscript.lens;

  useEffect(() => {
    if (!transcript || voiceState !== 'processing') {
      return;
    }

    if (parsedTranscript.matchedFields.length === 0) {
      setVoiceFeedback('No fields recognized.');
      return;
    }

    if (voiceTranscriptApplyMode !== 'auto_apply') {
      return;
    }

    updateValues((current) =>
      applyParsedTranscriptToValues(current, parsedTranscript, resolvedTranscriptLensName),
    );
    setVoiceFeedback(formatAutoApplySummary(parsedTranscript));
    clearTranscript();
  }, [
    clearTranscript,
    resolvedTranscriptLensName,
    parsedTranscript,
    transcript,
    updateValues,
    voiceState,
    voiceTranscriptApplyMode,
  ]);

  const locationAccuracyLabel = formatAccuracyLabel(values.locationAccuracy);
  const locationPreview = formatLocationPreview(
    values.latitude,
    values.longitude,
  );
  const useDualPickerRow = width >= 400;
  let locationStatusText: string | null = null;
  const voiceControlActive = voiceState === 'listening' || voiceState === 'starting';
  const voiceControlDisabled = voiceState === 'processing';
  const handleVoiceControlPress = useCallback(() => {
    if (voiceControlDisabled) {
      return;
    }

    if (voiceControlActive) {
      stopListening();
      return;
    }

    void startListening();
  }, [startListening, stopListening, voiceControlActive, voiceControlDisabled]);
  const currentCapturedAt = parseCapturedAtValue(values.capturedAt) ?? new Date();
  const handleTimestampChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type !== 'set' || !selectedDate) {
      if (Platform.OS === 'android') {
        setActiveTimestampPicker(null);
      }
      return;
    }

    if (activeTimestampPicker === 'date') {
      updateValues((current) => ({
        ...current,
        capturedAt: applyDatePart(current.capturedAt, selectedDate),
      }));
      setActiveTimestampPicker('time');
      return;
    }

    if (activeTimestampPicker === 'time') {
      updateValues((current) => ({
        ...current,
        capturedAt: applyTimePart(current.capturedAt, selectedDate),
      }));
      setActiveTimestampPicker(null);
    }
  };

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

  useEffect(() => {
    if (externalVoiceToggleSignal === undefined) {
      return;
    }

    if (previousExternalVoiceToggleSignalRef.current === undefined) {
      previousExternalVoiceToggleSignalRef.current = externalVoiceToggleSignal;
      return;
    }

    if (externalVoiceToggleSignal === previousExternalVoiceToggleSignalRef.current) {
      return;
    }

    previousExternalVoiceToggleSignalRef.current = externalVoiceToggleSignal;
    handleVoiceControlPress();
  }, [externalVoiceToggleSignal, handleVoiceControlPress]);

  useEffect(() => {
    if (externalPrimarySubmitSignal === undefined) {
      return;
    }

    if (previousExternalPrimarySubmitSignalRef.current === undefined) {
      previousExternalPrimarySubmitSignalRef.current = externalPrimarySubmitSignal;
      return;
    }

    if (externalPrimarySubmitSignal === previousExternalPrimarySubmitSignalRef.current) {
      return;
    }

    previousExternalPrimarySubmitSignalRef.current = externalPrimarySubmitSignal;
    if (submitting) {
      return;
    }

    void onSubmit(values);
  }, [externalPrimarySubmitSignal, onSubmit, submitting, values]);

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
          <Pressable
            accessibilityLabel={
              voiceControlDisabled
                ? 'Voice transcription processing'
                : voiceControlActive
                  ? 'Stop voice recording'
                  : 'Start voice recording'
            }
            disabled={voiceControlDisabled}
            hitSlop={8}
            onPress={handleVoiceControlPress}
            style={[
              styles.voiceButton,
              voiceControlActive ? styles.voiceButtonActive : null,
              voiceControlDisabled ? styles.voiceButtonDisabled : null,
            ]}
          >
            {voiceControlActive ? (
              <VoiceControlIcon variant="stop" size={20} />
            ) : (
              <MicrophoneIcon size={20} />
            )}
          </Pressable>
        </View>

        {!voiceModuleReady || voiceAvailable ? null : (
          <Text style={styles.voiceStatusText}>
            Voice input needs a rebuilt native app after adding speech recognition.
          </Text>
        )}
        {voiceError ? <Text style={styles.errorText}>{voiceError}</Text> : null}
        {voiceFeedback ? <Text style={styles.voiceStatusText}>{voiceFeedback}</Text> : null}

        {transcript && voiceTranscriptApplyMode === 'review_before_apply' ? (
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
                    updateValues((current) =>
                      applyParsedTranscriptToValues(current, parsedTranscript, resolvedTranscriptLensName),
                    );
                    setVoiceFeedback(formatAutoApplySummary(parsedTranscript));
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
          onChange={(fStop) => updateValues((current) => ({ ...current, fStop }))}
          options={fStopOptions}
          style={useDualPickerRow ? styles.pickerColumn : null}
          value={values.fStop}
        />

        <HorizontalRadioPicker
          label={`Shutter (${stopStep} stop)`}
          onChange={(shutterSpeed) => updateValues((current) => ({ ...current, shutterSpeed }))}
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
            onChange={(item) => updateValues((current) => ({ ...current, lens: item.name }))}
            placeholder="Select or create a lens"
            type="lens"
            value={values.lens}
          />
        </View>
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Captured</Text>
        <View
          onLayout={(event) =>
            onTextFieldLayout?.('capturedAt', {
              y: event.nativeEvent.layout.y,
              height: event.nativeEvent.layout.height,
            })
          }
          style={styles.inlineFieldControl}
        >
          <View style={styles.timestampRow}>
            <Pressable
              onPress={() => {
                onTextFieldFocus?.('capturedAt');
                setActiveTimestampPicker('date');
              }}
              style={[styles.input, styles.inlineFieldInput, styles.timestampDisplay]}
            >
              <View style={styles.timestampTextGroup}>
                <Text style={styles.timestampDisplayText}>{formatCapturedAtValue(values.capturedAt).date}</Text>
                {formatCapturedAtValue(values.capturedAt).time ? (
                  <Text style={styles.timestampDisplaySubtext}>
                    {formatCapturedAtValue(values.capturedAt).time}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="Set captured time to now"
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  updateValues((current) => ({
                    ...current,
                    capturedAt: new Date().toISOString(),
                  }));
                }}
                style={styles.timestampNowButton}
              >
                <Text style={styles.timestampNowButtonText}>Now</Text>
              </Pressable>
            </Pressable>
          </View>
          {activeTimestampPicker ? (
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              mode={activeTimestampPicker}
              onChange={handleTimestampChange}
              value={currentCapturedAt}
            />
          ) : null}
        </View>
      </View>

      <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
        <Text style={styles.inlineFieldLabel}>Notes</Text>
        <TextInput
          multiline
          onChangeText={(notes) => updateValues((current) => ({ ...current, notes }))}
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
                <View style={styles.locationActionsColumn}>
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
                    updateValues((current) => ({ ...current, latitude }));
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
                    updateValues((current) => ({ ...current, longitude }));
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
                    updateValues((current) => ({ ...current, locationAccuracy }));
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
        {secondarySubmitAction ? (
          <View
            style={[
              styles.splitSubmitButton,
              submitting || secondarySubmitAction.disabled ? styles.primaryButtonDisabled : null,
            ]}
          >
            <Pressable
              disabled={submitting}
              onPress={() => void onSubmit(values)}
              style={({ pressed }) => [
                styles.splitSubmitPrimary,
                pressed && !submitting ? styles.splitSubmitPressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : submitLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={secondarySubmitAction.label}
              disabled={secondarySubmitAction.disabled || submitting}
              onPress={() => secondarySubmitAction.onPress(values)}
              style={({ pressed }) => [
                styles.splitSubmitSecondary,
                pressed && !(secondarySubmitAction.disabled || submitting)
                  ? styles.splitSubmitPressed
                  : null,
              ]}
            >
              <Text style={styles.splitSubmitSecondaryText}>▼</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.submitActions}>
            <Pressable
              disabled={submitting}
              onPress={() => void onSubmit(values)}
              style={[styles.primaryButton, submitting ? styles.primaryButtonDisabled : null]}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : submitLabel}</Text>
            </Pressable>
          </View>
        )}
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
    lineHeight: 20,
    paddingTop: 12,
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
  timestampDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampRow: {
    flexDirection: 'row',
  },
  timestampDisplayText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  timestampDisplaySubtext: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  timestampTextGroup: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  timestampNowButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.accent,
    flexShrink: 0,
  },
  timestampNowButtonText: {
    color: colors.background.surface,
    fontSize: 10,
    fontWeight: '700',
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
  voiceButtonDisabled: {
    opacity: 0.65,
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
  locationActionsColumn: {
    gap: 8,
    alignItems: 'center',
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
  submitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  splitSubmitButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    overflow: 'hidden',
  },
  splitSubmitPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  splitSubmitSecondary: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.background.surface,
  },
  splitSubmitPressed: {
    opacity: 0.85,
  },
  splitSubmitSecondaryText: {
    color: colors.background.surface,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
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

