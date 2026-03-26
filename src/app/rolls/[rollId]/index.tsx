import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MicrophoneIcon } from '@/components/microphone-icon';
import { PencilIcon } from '@/components/pencil-icon';
import { ShareIcon } from '@/components/share-icon';
import { formatEv100, formatExposureTimestamp } from '@/features/exposures/exposure-utils';
import { useExposures } from '@/features/exposures/use-exposures';
import { derivePushPullLabel, formatIso } from '@/features/rolls/roll-utils';
import { useRoll } from '@/features/rolls/use-rolls';
import { exportRollCsv } from '@/services/export/csv-export';
import { exportRollPdf } from '@/services/export/pdf-export';
import { colors } from '@/theme/colors';

export default function RollDetailScreen() {
  const insets = useSafeAreaInsets();
  const { rollId } = useLocalSearchParams<{ rollId: string }>();
  const { roll, loading, error } = useRoll(rollId);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exposuresExpanded, setExposuresExpanded] = useState(false);
  const [collapsedExposureIndex, setCollapsedExposureIndex] = useState(0);
  const {
    exposures,
    loading: exposuresLoading,
    error: exposuresError,
  } = useExposures(rollId ?? null);
  const previousExposureCountRef = useRef(0);

  useEffect(() => {
    if (exposures.length === 0) {
      previousExposureCountRef.current = 0;
      setCollapsedExposureIndex(0);
      return;
    }

    setCollapsedExposureIndex((current) => {
      if (previousExposureCountRef.current === 0) {
        return exposures.length - 1;
      }

      if (current >= exposures.length) {
        return exposures.length - 1;
      }

      return current;
    });

    previousExposureCountRef.current = exposures.length;
  }, [exposures.length]);

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

  const runRollExport = async (format: 'csv' | 'pdf') => {
    setExportMenuOpen(false);
    setExporting(true);

    try {
      if (format === 'pdf') {
        await exportRollPdf(roll);
      } else {
        await exportRollCsv(roll);
      }
    } catch (nextError) {
      Alert.alert(
        'Export failed',
        nextError instanceof Error
          ? nextError.message
          : `Failed to export roll ${format.toUpperCase()}.`,
      );
    } finally {
      setExporting(false);
    }
  };

  const handleExportRoll = () => {
    if (exporting) {
      return;
    }

    setExportMenuOpen(true);
  };

  const latestExposureIndex = Math.max(0, exposures.length - 1);
  const visibleExposures = exposuresExpanded
    ? exposures
    : exposures[collapsedExposureIndex]
      ? [exposures[collapsedExposureIndex]]
      : [];

  return (
    <>
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
        <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={exporting ? 'Exporting roll' : 'Export roll'}
              disabled={exporting}
              onPress={handleExportRoll}
              style={({ pressed }) => [
                styles.headerIconButton,
                styles.headerIconButtonLeft,
                exporting ? styles.headerIconButtonDisabled : null,
                pressed && !exporting ? styles.headerIconButtonPressed : null,
              ]}
            >
              <ShareIcon size={24} />
            </Pressable>
          <Pressable
            accessibilityLabel="Edit roll"
            onPress={() => router.push(`/rolls/${roll.id}/edit`)}
            style={({ pressed }) => [
              styles.headerIconButton,
              styles.headerIconButtonRight,
              pressed ? styles.headerIconButtonPressed : null,
            ]}
          >
            <PencilIcon
              color={colors.text.primary}
              size={24}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Exposures</Text>
          <View style={styles.cardHeaderActions}>
            {!exposuresExpanded && exposures.length > 1 ? (
              <Pressable
                accessibilityLabel="Jump to latest exposure"
                disabled={collapsedExposureIndex === latestExposureIndex}
                onPress={() => setCollapsedExposureIndex(latestExposureIndex)}
                style={[
                  styles.latestButton,
                  collapsedExposureIndex === latestExposureIndex ? styles.latestButtonDisabled : null,
                ]}
              >
                <Text style={styles.latestButtonText}>{'>|'}</Text>
              </Pressable>
            ) : null}
            {exposures.length > 1 ? (
              <Pressable
                onPress={() => setExposuresExpanded((current) => !current)}
                style={styles.collapseButton}
              >
                <Text style={styles.collapseButtonText}>
                  {exposuresExpanded ? 'Collapse' : `Show all (${exposures.length})`}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.addExposurePill}>
              <Pressable
                accessibilityLabel="Add exposure"
                onPress={() => router.push(`/exposures/new?rollId=${roll.id}`)}
                style={({ pressed }) => [
                  styles.addExposurePillHalf,
                  styles.addExposurePillLeft,
                  pressed ? styles.addExposurePillPressed : null,
                ]}
              >
                <Text style={styles.addExposureButtonText}>+</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Add exposure by voice"
                onPress={() => router.push(`/exposures/new?rollId=${roll.id}&autoVoice=1`)}
                style={({ pressed }) => [
                  styles.addExposurePillHalf,
                  styles.addExposurePillRight,
                  pressed ? styles.addExposurePillPressed : null,
                ]}
              >
                <View style={styles.voiceAddContent}>
                  <MicrophoneIcon color={colors.background.surface} size={18} />
                  <Text style={styles.voiceAddSuperscript}>+</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
        {exposuresLoading ? <Text style={styles.bodyText}>Loading exposures...</Text> : null}
        {exposuresError ? <Text style={styles.errorText}>{exposuresError}</Text> : null}
        {exposures.length === 0 && !exposuresLoading ? (
          <Text style={styles.bodyText}>No exposures logged on this roll yet.</Text>
        ) : null}

        {exposuresExpanded || exposures.length <= 1 ? (
          <View style={styles.exposureList}>
            {visibleExposures.map((exposure) => (
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
        ) : (
          <View style={styles.collapsedExposureRow}>
            <View style={styles.collapsedExposureCardWrap}>
              {visibleExposures.map((exposure) => (
                <View
                  key={exposure.id}
                  style={styles.collapsedExposureCard}
                >
                  <Pressable
                    accessibilityLabel="Show previous exposure"
                    onPress={() =>
                      setCollapsedExposureIndex((current) =>
                        current === 0 ? exposures.length - 1 : current - 1,
                      )
                    }
                    style={[styles.embeddedArrowButton, styles.embeddedArrowButtonLeft]}
                  >
                    <Text style={styles.pagerButtonText}>{'<'}</Text>
                  </Pressable>
                  <Link
                    asChild
                    href={`/exposures/${exposure.id}/edit`}
                  >
                    <Pressable style={StyleSheet.flatten([styles.exposureCard, styles.collapsedExposureContent])}>
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
                  <Pressable
                    accessibilityLabel="Show next exposure"
                    onPress={() =>
                      setCollapsedExposureIndex((current) =>
                        current >= exposures.length - 1 ? 0 : current + 1,
                      )
                    }
                    style={[styles.embeddedArrowButton, styles.embeddedArrowButtonRight]}
                  >
                    <Text style={styles.pagerButtonText}>{'>'}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}
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

      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={exportMenuOpen}
        onRequestClose={() => setExportMenuOpen(false)}
      >
        <Pressable
          accessibilityLabel="Close export options"
          onPress={() => setExportMenuOpen(false)}
          style={styles.exportOverlay}
        >
          <Pressable
            accessibilityRole="menu"
            onPress={(event) => event.stopPropagation()}
            style={styles.exportPopup}
          >
            <Text style={styles.exportPopupTitle}>Export roll</Text>
            <Text style={styles.exportPopupBody}>Choose a format to share.</Text>
            <Pressable
              accessibilityLabel="Export roll as CSV"
              onPress={() => {
                void runRollExport('csv');
              }}
              style={({ pressed }) => [
                styles.exportOption,
                pressed ? styles.exportOptionPressed : null,
              ]}
            >
              <Text style={styles.exportOptionTitle}>CSV</Text>
              <Text style={styles.exportOptionHint}>Flat data export for spreadsheets and scripts</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Export roll as PDF"
              onPress={() => {
                void runRollExport('pdf');
              }}
              style={({ pressed }) => [
                styles.exportOption,
                pressed ? styles.exportOptionPressed : null,
              ]}
            >
              <Text style={styles.exportOptionTitle}>PDF</Text>
              <Text style={styles.exportOptionHint}>Printable archive sheet for binder-style storage</Text>
            </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: 104,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  headerIconButton: {
    width: 52,
    minWidth: 52,
    height: 52,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
  },
  headerIconButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
  },
  headerIconButtonRight: {
    borderLeftWidth: 0,
  },
  headerIconButtonPressed: {
    backgroundColor: colors.background.canvas,
  },
  headerIconButtonDisabled: {
    opacity: 0.6,
  },
  exportOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.overlay,
    padding: 24,
  },
  exportPopup: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 18,
  },
  exportPopupTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  exportPopupBody: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  exportOption: {
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  exportOptionPressed: {
    backgroundColor: colors.background.surface,
  },
  exportOptionTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  exportOptionHint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  latestButton: {
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: 14,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  latestButtonDisabled: {
    opacity: 0.45,
  },
  latestButtonText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
  },
  pagerButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  collapsedExposureRow: {
    flexDirection: 'row',
  },
  collapsedExposureCardWrap: {
    flex: 1,
  },
  collapsedExposureCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    overflow: 'hidden',
  },
  embeddedArrowButton: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.canvas,
  },
  embeddedArrowButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
  },
  embeddedArrowButtonRight: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border.subtle,
  },
  collapsedExposureContent: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 0,
  },
  collapseButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  collapseButtonText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  addExposurePill: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.text.accent,
  },
  addExposurePillHalf: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    height: 36,
    backgroundColor: colors.text.accent,
  },
  addExposurePillLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.background.surface,
  },
  addExposurePillRight: {
    minWidth: 42,
    paddingHorizontal: 8,
  },
  addExposurePillPressed: {
    opacity: 0.85,
  },
  addExposureButtonText: {
    color: colors.background.surface,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '700',
  },
  voiceAddContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  voiceAddSuperscript: {
    color: colors.background.surface,
    fontSize: 10,
    lineHeight: 10,
    fontWeight: '700',
    marginLeft: -2,
    marginTop: -3,
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
});
