import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { PencilIcon } from '@/components/pencil-icon';
import { ShareIcon } from '@/components/share-icon';
import { formatEv100, formatExposureTimestamp } from '@/features/exposures/exposure-utils';
import { useExposures } from '@/features/exposures/use-exposures';
import { derivePushPullLabel, formatIso } from '@/features/rolls/roll-utils';
import { useRoll } from '@/features/rolls/use-rolls';
import { exportRollCsv } from '@/services/export/csv-export';
import { colors } from '@/theme/colors';

const HOLD_DELAY_MS = 300;
const PROGRESS_RING_SIZE = 46;
const PROGRESS_RING_STROKE = 3;
const PROGRESS_RING_RADIUS = (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function RollDetailScreen() {
  const insets = useSafeAreaInsets();
  const { rollId } = useLocalSearchParams<{ rollId: string }>();
  const { roll, loading, error } = useRoll(rollId);
  const [exporting, setExporting] = useState(false);
  const [exposuresExpanded, setExposuresExpanded] = useState(false);
  const [collapsedExposureIndex, setCollapsedExposureIndex] = useState(0);
  const {
    exposures,
    loading: exposuresLoading,
    error: exposuresError,
  } = useExposures(rollId ?? null);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const [holdActive, setHoldActive] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const previousExposureCountRef = useRef(0);

  useEffect(() => {
    return () => {
      holdProgress.stopAnimation();
    };
  }, [holdProgress]);

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

  const handleExportRoll = async () => {
    setExporting(true);

    try {
      await exportRollCsv(roll);
    } catch (nextError) {
      Alert.alert(
        'Export failed',
        nextError instanceof Error ? nextError.message : 'Failed to export roll CSV.',
      );
    } finally {
      setExporting(false);
    }
  };

  const resetHoldProgress = () => {
    holdProgress.stopAnimation();
    setHoldActive(false);
    holdProgress.setValue(0);
  };

  const startHoldProgress = () => {
    longPressTriggeredRef.current = false;
    setHoldActive(true);
    holdProgress.setValue(0);
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_DELAY_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const progressStrokeOffset = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [PROGRESS_RING_CIRCUMFERENCE, 0],
  });
  const addExposureScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  const latestExposureIndex = Math.max(0, exposures.length - 1);
  const visibleExposures = exposuresExpanded
    ? exposures
    : exposures[collapsedExposureIndex]
      ? [exposures[collapsedExposureIndex]]
      : [];

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
        <View style={styles.headerActions}>
            <Pressable
              accessibilityLabel={exporting ? 'Exporting roll' : 'Export roll'}
              disabled={exporting}
              onPress={() => void handleExportRoll()}
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
            <View style={styles.addExposureButtonWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.addExposureRing,
                  {
                    opacity: holdActive ? 1 : 0,
                  },
                ]}
              >
                <Svg
                  height={PROGRESS_RING_SIZE}
                  width={PROGRESS_RING_SIZE}
                >
                  <Circle
                    cx={PROGRESS_RING_SIZE / 2}
                    cy={PROGRESS_RING_SIZE / 2}
                    r={PROGRESS_RING_RADIUS}
                    stroke={colors.border.subtle}
                    strokeWidth={PROGRESS_RING_STROKE}
                    fill="none"
                  />
                  <AnimatedCircle
                    cx={PROGRESS_RING_SIZE / 2}
                    cy={PROGRESS_RING_SIZE / 2}
                    r={PROGRESS_RING_RADIUS}
                    stroke={colors.text.primary}
                    strokeWidth={PROGRESS_RING_STROKE}
                    fill="none"
                    rotation={-90}
                    originX={PROGRESS_RING_SIZE / 2}
                    originY={PROGRESS_RING_SIZE / 2}
                    strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
                    strokeDashoffset={progressStrokeOffset}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
              <Animated.View
                style={{
                  transform: [{ scale: addExposureScale }],
                }}
              >
                <Pressable
                  delayLongPress={HOLD_DELAY_MS}
                  onLongPress={() => {
                    longPressTriggeredRef.current = true;
                    holdProgress.stopAnimation();
                    holdProgress.setValue(1);
                    router.push(`/exposures/new?rollId=${roll.id}&autoVoice=1`);
                  }}
                  onPress={() => {
                    if (longPressTriggeredRef.current) {
                      longPressTriggeredRef.current = false;
                      resetHoldProgress();
                      return;
                    }

                    resetHoldProgress();
                    router.push(`/exposures/new?rollId=${roll.id}`);
                  }}
                  onPressIn={startHoldProgress}
                  onPressOut={resetHoldProgress}
                  style={styles.addExposureButton}
                >
                  <Text style={styles.addExposureButtonText}>+</Text>
                </Pressable>
              </Animated.View>
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
  addExposureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.text.accent,
  },
  addExposureButtonWrap: {
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExposureRing: {
    position: 'absolute',
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExposureButtonText: {
    color: colors.background.surface,
    fontSize: 24,
    lineHeight: 24,
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
});
