import { useEffect, useMemo, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { colors } from '@/theme/colors';

export default function NewExposureScreen() {
  const { rollId } = useLocalSearchParams<{ rollId?: string }>();
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
  const { groupedRolls, rolls, error: rollError } = useRolls();
  const { settings, error: settingsError } = useExposureDefaultsSettings();
  const [selectedRollId, setSelectedRollId] = useState<string | null>(rollId ?? null);
  const { latestExposure, createExposure, error: exposureError } = useExposures(selectedRollId);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (rollId) {
      setSelectedRollId(rollId);
      return;
    }

    setSelectedRollId((current) => {
      if (current) {
        return current;
      }

      return groupedRolls.active[0]?.id ?? null;
    });
  }, [groupedRolls.active, rollId]);

  const selectedRoll =
    rolls.find((candidate) => candidate.id === selectedRollId) ?? groupedRolls.active[0] ?? null;

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
      <Text style={styles.heading}>New Exposure</Text>
      <Text style={styles.subheading}>
        Log the next frame on a roll. Previous exposure values are used as defaults based on your settings.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roll</Text>
        {selectedRoll ? (
          <Text style={styles.cardValue}>
            {selectedRoll.filmStock} on {selectedRoll.camera}
          </Text>
        ) : (
          <Text style={styles.bodyText}>Pick an active roll before logging an exposure.</Text>
        )}
        <View style={styles.rollChips}>
          {groupedRolls.active.map((roll) => (
            <Pressable
              key={roll.id}
              onPress={() => setSelectedRollId(roll.id)}
              style={[
                styles.rollChip,
                selectedRollId === roll.id ? styles.rollChipActive : null,
              ]}
            >
              <Text
                style={selectedRollId === roll.id ? styles.rollChipTextActive : styles.rollChipText}
              >
                {roll.filmStock}
              </Text>
              <Text
                style={selectedRollId === roll.id ? styles.rollChipMetaActive : styles.rollChipMeta}
              >
                {roll.camera}
              </Text>
            </Pressable>
          ))}
        </View>
        {groupedRolls.active.length === 0 ? (
          <Text style={styles.bodyText}>No active rolls yet. Create a roll before adding exposures.</Text>
        ) : null}
      </View>

      {rollError ? <Text style={styles.errorText}>{rollError}</Text> : null}
      {settingsError ? <Text style={styles.errorText}>{settingsError}</Text> : null}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      {selectedRollId ? (
        <ExposureForm
          autoFetchCurrentLocation={
            settings.defaultLocationEnabled && settings.defaultLocationToCurrent
          }
          error={exposureError}
          initialValues={initialValues}
          onTextFieldBlur={handleFieldBlur}
          onTextFieldFocus={handleFieldFocus}
          onTextFieldLayout={registerFieldLayout}
          onCancel={() => {
            if (router.canGoBack()) {
              router.back();
            } else if (selectedRollId) {
              router.replace(`/rolls/${selectedRollId}`);
            } else {
              router.replace('/');
            }
          }}
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
        />
      ) : (
        <Link
          href="/rolls/new"
          style={styles.createRollLink}
        >
          Create a Roll
        </Link>
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
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  cardTitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardValue: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  bodyText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  rollChips: {
    gap: 10,
  },
  rollChip: {
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    padding: 14,
  },
  rollChipActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.background.surface,
  },
  rollChipText: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  rollChipTextActive: {
    color: colors.text.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  rollChipMeta: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  rollChipMetaActive: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
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
