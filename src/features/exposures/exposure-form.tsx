import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { GearSelector } from '@/components/gear-selector';
import { HorizontalRadioPicker } from '@/components/horizontal-radio-picker';
import { getFStopOptions, getShutterSpeedOptions } from '@/features/exposures/stop-values';
import { useCurrentLocation } from '@/features/exposures/use-current-location';
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

export function ExposureForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting = false,
  error,
  stopStep,
  autoFetchCurrentLocation = false,
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

      <View style={styles.group}>
        <Text style={styles.label}>Captured At</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(capturedAt) => setValues((current) => ({ ...current, capturedAt }))}
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
