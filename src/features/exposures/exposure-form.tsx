import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { GearSelector } from '@/components/gear-selector';
import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
import { CrosshairIcon } from '@/components/icons/crosshair-icon';
import { DeviceIcon } from '@/components/icons/device-icon';
import { MicrophoneIcon } from '@/components/icons/microphone-icon';
import { TrashIcon } from '@/components/icons/trash-icon';
import { VoiceControlIcon } from '@/components/icons/voice-control-icon';
import { resolveBestGearMatch } from '@/features/gear/gear-utils';
import { useGearRegistry } from '@/features/gear/use-gear-registry';
import {
  getFlashPowerOptions,
  getFStopOptions,
  getNdStopOptions,
  getShutterSpeedOptions,
} from '@/features/exposures/stop-values';
import { useCurrentLocation } from '@/features/exposures/use-current-location';
import { useExposureVoiceInput } from '@/features/exposures/use-exposure-voice-input';
import { getLocalTimestampMetadata } from '@/lib/time';
import { useExposureFormDraftStore } from '@/store/exposure-form-draft-store';
import { colors } from '@/theme/colors';
import type { ExposureStopStep, VoiceTranscriptApplyMode } from '@/types/settings';

export type ExposureFormValues = {
  fStop: string;
  shutterSpeed: string;
  lens: string | null;
  flash: string | null;
  flashPower: string | null;
  ndStops: string | null;
  capturedAt: string;
  notes: string;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  capturedAtOffset: string | null;
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
  gpsQuickFixStaleMinutes?: number;
  onTextFieldLayout?: (fieldName: string, layout: { y: number; height: number }) => void;
  onTextFieldFocus?: (fieldName: string) => void;
  onTextFieldBlur?: (fieldName: string) => void;
  onValuesChange?: (values: ExposureFormValues) => void;
  draftKey?: string;
  externalVoiceToggleSignal?: number;
  externalVoiceApplySignal?: number;
  externalVoiceClearSignal?: number;
  onVoiceReviewStateChange?: (visible: boolean) => void;
  onLocationRefinementStateChange?: (needsRefinement: boolean) => void;
  onParsedFrame?: (frame: number) => void;
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
  const latitudeValue = Number(latitude.trim());
  const longitudeValue = Number(longitude.trim());

  if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue)) {
    return null;
  }

  return `${latitudeValue.toFixed(5)}, ${longitudeValue.toFixed(5)}`;
}

const UTC_OFFSET_OPTIONS = [
  '-12:00',
  '-11:00',
  '-10:00',
  '-09:30',
  '-09:00',
  '-08:00',
  '-07:00',
  '-06:00',
  '-05:00',
  '-04:00',
  '-03:30',
  '-03:00',
  '-02:00',
  '-01:00',
  '+00:00',
  '+01:00',
  '+02:00',
  '+03:00',
  '+03:30',
  '+04:00',
  '+04:30',
  '+05:00',
  '+05:30',
  '+05:45',
  '+06:00',
  '+06:30',
  '+07:00',
  '+08:00',
  '+08:45',
  '+09:00',
  '+09:30',
  '+10:00',
  '+10:30',
  '+11:00',
  '+12:00',
  '+12:45',
  '+13:00',
  '+14:00',
];

function formatUtcOffsetLabel(value: string | null) {
  return value ? `UTC${value}` : 'Set UTC offset';
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
    flashPower: string | null;
    ndStops: string | null;
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
    flashPower: parsedTranscript.flashPower ?? current.flashPower,
    ndStops: parsedTranscript.ndStops ?? current.ndStops,
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
  lens: string | null;
  flashPower: string | null;
  ndStops: string | null;
  notes: string | null;
  frame: number | null;
}) {
  const parts: string[] = [];

  if (parsedTranscript.fStop) {
    parts.push(`f-stop ${parsedTranscript.fStop}`);
  }
  if (parsedTranscript.shutterSpeed) {
    parts.push(`shutter ${parsedTranscript.shutterSpeed}`);
  }
  if (parsedTranscript.lens && parsedTranscript.matchedFields.includes('lens')) {
    parts.push(`lens ${parsedTranscript.lens}`);
  }
  if (parsedTranscript.flashPower && parsedTranscript.matchedFields.includes('flashPower')) {
    parts.push(`flash ${parsedTranscript.flashPower}`);
  }
  if (parsedTranscript.ndStops && parsedTranscript.matchedFields.includes('ndStops')) {
    parts.push(`ND ${parsedTranscript.ndStops}`);
  }
  if (parsedTranscript.notes && parsedTranscript.matchedFields.includes('notes')) {
    parts.push(`notes "${parsedTranscript.notes}"`);
  }
  if (parsedTranscript.frame && parsedTranscript.matchedFields.includes('frame')) {
    parts.push(`frame ${parsedTranscript.frame}`);
  }

  return parts.length > 0 ? `Applied ${parts.join(', ')}.` : null;
}

function formatParsedVoiceValues(parsedTranscript: {
  matchedFields: string[];
  fStop: string | null;
  shutterSpeed: string | null;
  lens: string | null;
  flashPower: string | null;
  ndStops: string | null;
  notes: string | null;
  frame: number | null;
}) {
  const parts: string[] = [];

  if (parsedTranscript.fStop && parsedTranscript.matchedFields.includes('fStop')) {
    parts.push(parsedTranscript.fStop);
  }
  if (parsedTranscript.shutterSpeed && parsedTranscript.matchedFields.includes('shutterSpeed')) {
    parts.push(parsedTranscript.shutterSpeed);
  }
  if (parsedTranscript.lens && parsedTranscript.matchedFields.includes('lens')) {
    parts.push(`lens ${parsedTranscript.lens}`);
  }
  if (parsedTranscript.flashPower && parsedTranscript.matchedFields.includes('flashPower')) {
    parts.push(`flash ${parsedTranscript.flashPower}`);
  }
  if (parsedTranscript.ndStops && parsedTranscript.matchedFields.includes('ndStops')) {
    parts.push(`ND ${parsedTranscript.ndStops}`);
  }
  if (parsedTranscript.frame && parsedTranscript.matchedFields.includes('frame')) {
    parts.push(`frame ${parsedTranscript.frame}`);
  }
  if (parsedTranscript.notes && parsedTranscript.matchedFields.includes('notes')) {
    parts.push(`notes "${parsedTranscript.notes}"`);
  }

  return parts.join(', ');
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
  return getLocalTimestampMetadata(nextValue);
}

function applyTimePart(baseValue: string, selectedDate: Date) {
  const nextValue = parseCapturedAtValue(baseValue) ?? new Date();
  nextValue.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
  return getLocalTimestampMetadata(nextValue);
}

function areFormValuesEqual(left: ExposureFormValues, right: ExposureFormValues) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function shouldStartDetailsExpanded(values: ExposureFormValues) {
  return Boolean(values.flash);
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
  gpsQuickFixStaleMinutes = 3,
  onTextFieldLayout,
  onTextFieldFocus,
  onTextFieldBlur,
  onValuesChange,
  draftKey,
  externalVoiceToggleSignal,
  externalVoiceApplySignal,
  externalVoiceClearSignal,
  onVoiceReviewStateChange,
  onLocationRefinementStateChange,
  onParsedFrame,
  secondarySubmitAction,
}: ExposureFormProps) {
  const draftValues = useExposureFormDraftStore((state) =>
    draftKey ? state.drafts[draftKey]?.values ?? null : null,
  );
  const clearDraftValues = useExposureFormDraftStore((state) => state.clearDraftValues);
  const setDraftValues = useExposureFormDraftStore((state) => state.setDraftValues);
  const [values, setValues] = useState(() => draftValues ?? initialValues);
  const previousDraftKeyRef = useRef(draftKey);
  const fStopOptions = getFStopOptions(stopStep);
  const shutterSpeedOptions = getShutterSpeedOptions(stopStep);
  const flashPowerOptions = getFlashPowerOptions(stopStep);
  const flashPickerOptions = values.flash ? ['No Flash', ...flashPowerOptions] : ['No Flash'];
  const ndStopOptions = getNdStopOptions(stopStep);
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
  const [detailsExpanded, setDetailsExpanded] = useState(() =>
    shouldStartDetailsExpanded(draftValues ?? initialValues),
  );
  const [followLocationUpdates, setFollowLocationUpdates] = useState(autoFetchCurrentLocation);
  const [appliedLocationVersion, setAppliedLocationVersion] = useState(0);
  const [locationManualOverride, setLocationManualOverride] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [activeTimestampPicker, setActiveTimestampPicker] = useState<'date' | 'time' | null>(null);
  const [offsetPickerOpen, setOffsetPickerOpen] = useState(false);
  const previousExternalVoiceToggleSignalRef = useRef<number | undefined>(undefined);
  const previousExternalVoiceApplySignalRef = useRef<number | undefined>(undefined);
  const previousExternalVoiceClearSignalRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousDraftKeyRef.current === draftKey) {
      return;
    }

    previousDraftKeyRef.current = draftKey;
    const nextValues = draftValues ?? initialValues;
    setValues(nextValues);
    setDetailsExpanded(shouldStartDetailsExpanded(nextValues));
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
    setOffsetPickerOpen(false);
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

  useEffect(() => {
    onValuesChange?.(values);
  }, [onValuesChange, values]);

  const updateValues = useCallback(
    (updater: ExposureFormValues | ((current: ExposureFormValues) => ExposureFormValues)) => {
      setValues((current) => (typeof updater === 'function' ? updater(current) : updater));
    },
    [],
  );

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
    void requestCurrentLocation(gpsQuickFixStaleMinutes).catch(() => {
      // hook error is already surfaced
    });
  }, [
    autoFetchCurrentLocation,
    clearLocationError,
    gpsQuickFixStaleMinutes,
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

    if (!locationLoading && latestLocation.source === 'refined') {
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
  const actionableMatchedFields = useMemo(
    () =>
      parsedTranscript.matchedFields.filter((field) => field !== 'frame' || Boolean(onParsedFrame)),
    [onParsedFrame, parsedTranscript.matchedFields],
  );
  const voiceReviewVisible = Boolean(transcript && voiceTranscriptApplyMode === 'review_before_apply');
  const applyVoiceTranscript = useCallback(() => {
    if (!voiceReviewVisible || actionableMatchedFields.length === 0) {
      return;
    }

    if (parsedTranscript.frame && onParsedFrame) {
      onParsedFrame(parsedTranscript.frame);
    }
    updateValues((current) =>
      applyParsedTranscriptToValues(current, parsedTranscript, resolvedTranscriptLensName),
    );
    setVoiceFeedback(
      formatAutoApplySummary({
        ...parsedTranscript,
        lens: resolvedTranscriptLensName,
        matchedFields: actionableMatchedFields,
      }),
    );
    clearTranscript();
  }, [
    actionableMatchedFields,
    clearTranscript,
    onParsedFrame,
    parsedTranscript,
    resolvedTranscriptLensName,
    updateValues,
    voiceReviewVisible,
  ]);
  const clearVoiceTranscriptReview = useCallback(() => {
    if (!voiceReviewVisible) {
      return;
    }

    cancelListening();
  }, [cancelListening, voiceReviewVisible]);

  useEffect(() => {
    if (!transcript || voiceState !== 'processing') {
      return;
    }

    if (actionableMatchedFields.length === 0) {
      setVoiceFeedback('No fields recognized.');
      if (voiceTranscriptApplyMode === 'auto_apply') {
        clearTranscript();
      }
      return;
    }

    if (voiceTranscriptApplyMode !== 'auto_apply') {
      return;
    }

    if (parsedTranscript.frame && onParsedFrame) {
      onParsedFrame(parsedTranscript.frame);
    }
    updateValues((current) =>
      applyParsedTranscriptToValues(current, parsedTranscript, resolvedTranscriptLensName),
    );
    setVoiceFeedback(
      formatAutoApplySummary({
        ...parsedTranscript,
        lens: resolvedTranscriptLensName,
        matchedFields: actionableMatchedFields,
      }),
    );
    clearTranscript();
  }, [
    actionableMatchedFields,
    clearTranscript,
    onParsedFrame,
    resolvedTranscriptLensName,
    parsedTranscript,
    transcript,
    updateValues,
    voiceState,
    voiceTranscriptApplyMode,
  ]);

  useEffect(() => {
    onVoiceReviewStateChange?.(voiceReviewVisible);
  }, [onVoiceReviewStateChange, voiceReviewVisible]);

  useEffect(() => {
    onLocationRefinementStateChange?.(
      followLocationUpdates && Boolean(latestLocation?.needsRefinement),
    );
  }, [followLocationUpdates, latestLocation?.needsRefinement, onLocationRefinementStateChange]);

  const locationAccuracyLabel = formatAccuracyLabel(values.locationAccuracy);
  const locationPreview = formatLocationPreview(
    values.latitude,
    values.longitude,
  );
  let locationStatusText: string | null = null;
  const voiceControlActive = voiceState === 'listening' || voiceState === 'starting';
  const voiceControlDisabled =
    voiceTranscriptApplyMode === 'review_before_apply' && voiceState === 'processing';
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
        ...applyDatePart(current.capturedAt, selectedDate),
      }));
      setActiveTimestampPicker('time');
      return;
    }

    if (activeTimestampPicker === 'time') {
      updateValues((current) => ({
        ...current,
        ...applyTimePart(current.capturedAt, selectedDate),
      }));
      setActiveTimestampPicker(null);
    }
  };

  if (locationError) {
    locationStatusText = locationError;
  } else if (locationLoading && latestLocation?.source === 'quick') {
    locationStatusText = locationAccuracyLabel
      ? `Using quick GPS fix for now (${locationAccuracyLabel}) while GPS refines.`
      : 'Using quick GPS fix for now while GPS refines.';
  } else if (locationLoading) {
    locationStatusText = 'Fetching current GPS location...';
  } else if (latestLocation?.source === 'refined') {
    locationStatusText = locationAccuracyLabel
      ? `Current GPS locked (${locationAccuracyLabel}).`
      : 'Current GPS locked.';
  } else if (latestLocation?.source === 'quick') {
    locationStatusText = locationAccuracyLabel
      ? `Using quick GPS fix (${locationAccuracyLabel}).`
      : 'Using quick GPS fix.';
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
    if (externalVoiceApplySignal === undefined) {
      return;
    }

    if (previousExternalVoiceApplySignalRef.current === undefined) {
      previousExternalVoiceApplySignalRef.current = externalVoiceApplySignal;
      return;
    }

    if (externalVoiceApplySignal === previousExternalVoiceApplySignalRef.current) {
      return;
    }

    previousExternalVoiceApplySignalRef.current = externalVoiceApplySignal;
    applyVoiceTranscript();
  }, [applyVoiceTranscript, externalVoiceApplySignal]);

  useEffect(() => {
    if (externalVoiceClearSignal === undefined) {
      return;
    }

    if (previousExternalVoiceClearSignalRef.current === undefined) {
      previousExternalVoiceClearSignalRef.current = externalVoiceClearSignal;
      return;
    }

    if (externalVoiceClearSignal === previousExternalVoiceClearSignalRef.current) {
      return;
    }

    previousExternalVoiceClearSignalRef.current = externalVoiceClearSignal;
    clearVoiceTranscriptReview();
  }, [clearVoiceTranscriptReview, externalVoiceClearSignal]);

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

        {voiceReviewVisible ? (
          <View style={styles.voiceResult}>
            <Text style={styles.voiceResultLabel}>Transcript</Text>
            <Text style={styles.voiceTranscript}>{transcript}</Text>

            {actionableMatchedFields.length > 0 ? (
              <Text style={styles.voiceStatusText}>
                Parsed{' '}
                {formatParsedVoiceValues({
                  ...parsedTranscript,
                  lens: resolvedTranscriptLensName,
                  matchedFields: actionableMatchedFields,
                })}
                .
              </Text>
            ) : (
              <Text style={styles.voiceStatusText}>
                No exposure fields were recognized yet. Use explicit words like “f stop”, “at”, “lens”, and “notes”.
              </Text>
            )}

            <View style={styles.voiceActions}>
                <Pressable
                  onPress={applyVoiceTranscript}
                style={[
                  styles.primaryButton,
                  actionableMatchedFields.length === 0 ? styles.primaryButtonDisabled : null,
                ]}
                disabled={actionableMatchedFields.length === 0}
              >
                <Text style={styles.primaryButtonText}>Apply Transcript</Text>
              </Pressable>
              <Pressable
                onPress={clearVoiceTranscriptReview}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.exposurePickerGrid}>
        <HorizontalRadioPicker
          label={`F-Stop (${stopStep} stop)`}
          onChange={(fStop) => updateValues((current) => ({ ...current, fStop }))}
          options={fStopOptions}
          style={styles.exposurePickerCell}
          value={values.fStop}
        />

        <HorizontalRadioPicker
          label={`Shutter (${stopStep} stop)`}
          onChange={(shutterSpeed) => updateValues((current) => ({ ...current, shutterSpeed }))}
          options={shutterSpeedOptions}
          style={styles.exposurePickerCell}
          value={values.shutterSpeed}
        />

        <HorizontalRadioPicker
          label={`Flash (${stopStep} stop)`}
          onChange={(flashPower) => {
            if (flashPower === 'No Flash') {
              updateValues((current) => ({ ...current, flash: null, flashPower: null }));
              return;
            }

            if (!values.flash) {
              return;
            }
            updateValues((current) => ({ ...current, flashPower }));
          }}
          options={flashPickerOptions}
          style={styles.exposurePickerCell}
          value={values.flash ? values.flashPower ?? flashPowerOptions[0] : 'No Flash'}
        />

        <HorizontalRadioPicker
          label={`ND (${stopStep} stop)`}
          onChange={(ndStops) =>
            updateValues((current) => ({
              ...current,
              ndStops: ndStops === 'No ND' ? null : ndStops,
            }))}
          options={ndStopOptions}
          style={styles.exposurePickerCell}
          value={values.ndStops ?? 'No ND'}
        />
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

      <View style={styles.detailsCard}>
        <Pressable
          onPress={() => setDetailsExpanded((current) => !current)}
          style={({ pressed }) => [
            styles.detailsToggle,
            pressed ? styles.detailsTogglePressed : null,
          ]}
        >
          <Text style={styles.detailsToggleLabel}>Details</Text>
          <Text style={styles.detailsToggleValue}>{detailsExpanded ? 'Hide' : 'Show'}</Text>
        </Pressable>

        {detailsExpanded ? (
          <View style={styles.detailsContent}>
            <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
              <Text style={styles.inlineFieldLabel}>Lens</Text>
              <View style={styles.inlineFieldControl}>
                <GearSelector
                  compact
                  hideLabel
                  label="Lens"
                  clearAccessibilityLabel="Clear lens"
                  onChange={(item) => updateValues((current) => ({ ...current, lens: item.name }))}
                  onClear={() => updateValues((current) => ({ ...current, lens: null }))}
                  placeholder="Select or create a lens"
                  type="lens"
                  value={values.lens}
                />
              </View>
            </View>

            <View style={[styles.inlineFieldRow, styles.inlineFieldRowTop]}>
              <Text style={styles.inlineFieldLabel}>Flash</Text>
              <View style={styles.inlineFieldControl}>
                <GearSelector
                  compact
                  hideLabel
                  label="Flash"
                  clearAccessibilityLabel="Clear flash"
                  onChange={(item) =>
                    updateValues((current) => ({
                      ...current,
                      flash: item.name,
                    }))}
                  onClear={() =>
                    updateValues((current) => ({
                      ...current,
                      flash: null,
                      flashPower: null,
                    }))}
                  placeholder="Select or create a flash"
                  type="flash"
                  value={values.flash}
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
                    style={[styles.input, styles.inlineFieldInput, styles.timestampDisplay, styles.timestampDisplayWithCap]}
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
                        ...getLocalTimestampMetadata(),
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
              <Text style={styles.inlineFieldLabel}>UTC offset</Text>
              <View style={[styles.inlineFieldControl, styles.offsetFields]}>
                <View
                  onLayout={(event) =>
                    onTextFieldLayout?.('capturedAtOffset', {
                      y: event.nativeEvent.layout.y,
                      height: event.nativeEvent.layout.height,
                    })
                  }
                  style={[styles.input, styles.manualLocationInput, styles.offsetInputShell]}
                >
                  <Pressable
                    onPress={() => {
                      onTextFieldFocus?.('capturedAtOffset');
                      setOffsetPickerOpen(true);
                    }}
                    style={styles.offsetInput}
                  >
                    <Text
                      numberOfLines={1}
                      style={values.capturedAtOffset ? styles.offsetInputText : styles.offsetPlaceholderText}
                    >
                      {formatUtcOffsetLabel(values.capturedAtOffset)}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Use phone UTC offset"
                    hitSlop={8}
                    onPress={() =>
                      updateValues((current) => ({
                        ...current,
                        ...getLocalTimestampMetadata(parseCapturedAtValue(current.capturedAt) ?? new Date()),
                      }))}
                    style={styles.offsetPhoneButton}
                  >
                    <DeviceIcon size={16} />
                  </Pressable>
                </View>
              </View>
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
                      styles.locationSummaryCardWithCap,
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
                          void requestCurrentLocation(gpsQuickFixStaleMinutes).catch(() => {
                            // hook error is surfaced by the hook
                          });
                        }}
                        style={[
                          styles.locationCapButton,
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
          </View>
        ) : null}
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
              <Text style={styles.splitSubmitSecondaryText}>{secondarySubmitAction.label}</Text>
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

      <Modal
        animationType="fade"
        transparent
        visible={offsetPickerOpen}
        onRequestClose={() => setOffsetPickerOpen(false)}
      >
        <Pressable
          onPress={() => {
            onTextFieldBlur?.('capturedAtOffset');
            setOffsetPickerOpen(false);
          }}
          style={styles.offsetModalRoot}
        >
          <View style={styles.offsetModalBackdrop} />
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.offsetModalCard}
          >
            <Text style={styles.offsetModalTitle}>UTC offset</Text>
            <Text style={styles.offsetModalHint}>Choose the wall-clock offset for this exposure.</Text>
            <ScrollView
              contentContainerStyle={styles.offsetOptions}
              keyboardShouldPersistTaps="handled"
              style={styles.offsetOptionsScroll}
            >
              {UTC_OFFSET_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    updateValues((current) => ({
                      ...current,
                      capturedAtOffset: option,
                    }));
                    onTextFieldBlur?.('capturedAtOffset');
                    setOffsetPickerOpen(false);
                  }}
                  style={[
                    styles.offsetOption,
                    values.capturedAtOffset === option ? styles.offsetOptionSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.offsetOptionText,
                      values.capturedAtOffset === option ? styles.offsetOptionSelectedText : null,
                    ]}
                  >
                    {formatUtcOffsetLabel(option)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  exposurePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exposurePickerCell: {
    flexBasis: '48%',
    flexGrow: 1,
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
    minHeight: 64,
  },
  detailsCard: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsTogglePressed: {
    opacity: 0.85,
  },
  detailsToggleLabel: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsToggleValue: {
    color: colors.text.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  detailsContent: {
    gap: 16,
  },
  timestampDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampDisplayWithCap: {
    gap: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    minWidth: 0,
    gap: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border.subtle,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: colors.background.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timestampNowButton: {
    width: 48,
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderColor: colors.text.accent,
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
  locationSummaryCardWithCap: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
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
  locationCapButton: {
    width: 48,
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderColor: colors.text.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.accent,
    flexShrink: 0,
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border.subtle,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: colors.background.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
  offsetFields: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offsetInputShell: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  offsetInput: {
    flex: 1,
    minWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border.subtle,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  offsetInputText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  offsetPlaceholderText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  offsetPhoneButton: {
    width: 48,
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderColor: colors.text.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text.accent,
    flexShrink: 0,
  },
  offsetModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  offsetModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.overlay,
  },
  offsetModalCard: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background.surface,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  offsetModalTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  offsetModalHint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  offsetOptionsScroll: {
    flexGrow: 0,
  },
  offsetOptions: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  offsetOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  offsetOptionSelected: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  offsetOptionText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  offsetOptionSelectedText: {
    color: colors.background.surface,
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
    minWidth: 44,
    paddingHorizontal: 10,
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
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 14,
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


