import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exportRollCsv } from '@/services/export/csv-export';
import { formatEv100, formatExposureTimestamp } from '@/features/exposures/exposure-utils';
import { useExposures } from '@/features/exposures/use-exposures';
import { derivePushPullLabel, formatIso } from '@/features/rolls/roll-utils';
import { useRoll } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';

export default function RollDetailScreen() {
  const insets = useSafeAreaInsets();
  const { rollId } = useLocalSearchParams<{ rollId: string }>();
  const { roll, loading, error } = useRoll(rollId);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const {
    exposures,
    loading: exposuresLoading,
    error: exposuresError,
  } = useExposures(rollId ?? null);

  if (loading) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.meta}>Loading roll...</Text>
      </ScrollView>
    );
  }

  if (!roll) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom: 24 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.errorText}>{error ?? 'Roll not found.'}</Text>
      </ScrollView>
    );
  }

  const handleExportRoll = async () => {
    setExporting(true);
    setExportError(null);
    setExportMessage(null);

    try {
      const result = await exportRollCsv(roll);
      setExportMessage(
        `Shared CSV for this roll (${result.exportedRows} row${result.exportedRows === 1 ? '' : 's'}).`,
      );
    } catch (nextError) {
      setExportError(nextError instanceof Error ? nextError.message : 'Failed to export roll CSV.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.heading}>{roll.nickname ?? 'Untitled Roll'}</Text>
          <Text style={styles.subheading}>{roll.filmStock}</Text>
          <Text style={styles.subheading}>{roll.camera}</Text>
        </View>
        <Link
          href={`/rolls/${roll.id}/edit`}
          style={styles.editLink}
        >
          Edit
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>ISO</Text>
        <Text style={styles.cardValue}>{formatIso(roll.nativeIso, roll.shotIso)}</Text>
        <Text style={styles.cardHint}>{derivePushPullLabel(roll.nativeIso, roll.shotIso)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.cardValue}>{roll.status}</Text>
        <Text style={styles.cardHint}>
          Started {roll.startedAt ? new Date(roll.startedAt).toLocaleString() : 'not set'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notes</Text>
        <Text style={styles.bodyText}>{roll.notes ?? 'No notes yet.'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export</Text>
        <Text style={styles.bodyText}>Export this roll as a CSV file for sharing or archiving.</Text>
        {exportMessage ? <Text style={styles.successText}>{exportMessage}</Text> : null}
        {exportError ? <Text style={styles.errorText}>{exportError}</Text> : null}
        <Pressable
          onPress={() => void handleExportRoll()}
          style={styles.exportButton}
        >
          <Text style={styles.exportButtonText}>{exporting ? 'Exporting...' : 'Export Roll CSV'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exposures</Text>
        <Link
          href={`/exposures/new?rollId=${roll.id}`}
          style={styles.secondaryLink}
        >
          Add Exposure
        </Link>
        {exposuresLoading ? <Text style={styles.bodyText}>Loading exposures...</Text> : null}
        {exposuresError ? <Text style={styles.errorText}>{exposuresError}</Text> : null}
        {exposures.length === 0 && !exposuresLoading ? (
          <Text style={styles.bodyText}>No exposures logged on this roll yet.</Text>
        ) : null}

        <View style={styles.exposureList}>
          {exposures.map((exposure) => (
            <Link
              asChild
              key={exposure.id}
              href={`/exposures/${exposure.id}/edit`}
            >
              <Pressable style={styles.exposureCard}>
                <Text style={styles.exposureTitle}>
                  #{exposure.sequenceNumber} · {exposure.fStop} · {exposure.shutterSpeed}
                </Text>
                <Text style={styles.exposureLens}>{exposure.lens ?? 'No lens recorded'}</Text>
                <Text style={styles.exposureMeta}>
                  {formatEv100(exposure.fStop, exposure.shutterSpeed, roll.shotIso)} ·{' '}
                  {formatExposureTimestamp(exposure.capturedAt)}
                </Text>
                {exposure.notes ? <Text style={styles.exposureNotes}>{exposure.notes}</Text> : null}
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  editLink: {
    color: colors.background.surface,
    backgroundColor: colors.text.accent,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    gap: 8,
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
    fontSize: 20,
    fontWeight: '700',
  },
  cardHint: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  bodyText: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  secondaryLink: {
    color: colors.text.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  exposureList: {
    gap: 10,
  },
  exposureCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    padding: 14,
  },
  exposureTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  exposureLens: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  exposureMeta: {
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: 2,
  },
  exposureNotes: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
  successText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  exportButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportButtonText: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
