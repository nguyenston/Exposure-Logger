import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { GearSelector } from '@/components/gear-selector';
import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
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
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  stopStep: ExposureStopStep;
  autoFetchCurrentLocation?: boolean;
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

  return `${Math.round(numeric)}m accuracy`;
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
  onCancel,
  submitting = false,
  error,
  stopStep,
  autoFetchCurrentLocation = false,
  onTextFieldLayout,
  onTextFieldFocus,
  onTextFieldBlur,
}: ExposureFormProps) {
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

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (
      !autoFetchCurrentLocation ||
      !values.locationEnabled ||
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
    values.locationEnabled,
    values.longitude,
  ]);

  useEffect(() => {
    if (!followLocationUpdates || !latestLocation || appliedLocationVersion >= locationVersion) {
      return;
    }

    setValues((current) => ({
      ...current,
      locationEnabled: true,
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
  let locationStatusText: string | null = null;

  if (values.locationEnabled) {
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
    } else if (values.latitude.trim() || values.longitude.trim()) {
      locationStatusText = locationAccuracyLabel
        ? `Manual coordinates entered (${locationAccuracyLabel}).`
        : 'Manual coordinates entered.';
    } else {
      locationStatusText = 'Location is enabled but no coordinates have been captured yet.';
    }
  }

  return (
    <View style={styles.form}>
      <HorizontalRadioPicker
        label={`F-Stop (${stopStep} stop)`}
        onChange={(fStop) => setValues((current) => ({ ...current, fStop }))}
        options={fStopOptions}
        value={values.fStop}
      />

      <HorizontalRadioPicker
        label={`Shutter Speed (${stopStep} stop)`}
        onChange={(shutterSpeed) => setValues((current) => ({ ...current, shutterSpeed }))}
        options={shutterSpeedOptions}
        value={values.shutterSpeed}
      />

      <GearSelector
        label="Lens"
        onChange={(item) => setValues((current) => ({ ...current, lens: item.name }))}
        placeholder="Select or create a lens"
        type="lens"
        value={values.lens}
      />

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
              onPress={() => stopListening()}
              style={[styles.voiceButton, styles.voiceButtonActive]}
            >
              <Text style={styles.voiceButtonText}>
                {voiceState === 'listening' ? 'Stop' : 'Finishing...'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => void startListening()}
              style={styles.voiceButton}
            >
              <Text style={styles.voiceButtonText}>Start Voice</Text>
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

      <View style={styles.group}>
        <Text style={styles.label}>Captured At</Text>
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
          style={styles.input}
          value={values.capturedAt}
        />
      </View>

      <View style={styles.locationHeader}>
        <View style={styles.locationCopy}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.hint}>
            Location capture defaults are configurable in Settings. Manual coordinates remain editable here.
          </Text>
        </View>
        <Switch
          onValueChange={(locationEnabled) =>
            setValues((current) => ({ ...current, locationEnabled }))
          }
          trackColor={{
            false: colors.border.subtle,
            true: colors.text.accent,
          }}
          value={values.locationEnabled}
        />
      </View>

      {values.locationEnabled ? (
        <View style={styles.locationFields}>
          <Pressable
            disabled={locationLoading}
            onPress={() => {
              clearLocationError();
              setFollowLocationUpdates(true);
              void requestCurrentLocation().catch(() => {
                // hook error is surfaced by the hook
              });
            }}
            style={[styles.locationButton, locationLoading ? styles.locationButtonDisabled : null]}
          >
            <Text style={styles.locationButtonText}>
              {locationLoading ? 'Fetching GPS...' : 'Use Current Location'}
            </Text>
          </Pressable>
          {locationStatusText ? <Text style={styles.locationStatusText}>{locationStatusText}</Text> : null}

          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
            onChangeText={(latitude) => setValues((current) => ({ ...current, latitude }))}
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
            style={styles.input}
            value={values.latitude}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
            onChangeText={(longitude) => setValues((current) => ({ ...current, longitude }))}
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
            style={styles.input}
            value={values.longitude}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="decimal-pad"
            onChangeText={(locationAccuracy) =>
              setValues((current) => ({ ...current, locationAccuracy }))
            }
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
            style={styles.input}
            value={values.locationAccuracy}
          />
        </View>
      ) : null}

      <View style={styles.group}>
        <Text style={styles.label}>Notes</Text>
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
          style={[styles.input, styles.notesInput]}
          textAlignVertical="top"
          value={values.notes}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.actions}>
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        ) : null}
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
  group: {
    gap: 8,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
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
    minHeight: 112,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  hint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  locationFields: {
    gap: 10,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  voiceCopy: {
    flex: 1,
    gap: 4,
  },
  voiceButton: {
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  voiceButtonActive: {
    backgroundColor: colors.text.primary,
  },
  voiceButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
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
  locationButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationButtonDisabled: {
    opacity: 0.7,
  },
  locationButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  locationStatusText: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 8,
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
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
