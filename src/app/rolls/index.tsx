import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilmRollIcon } from '@/components/film-roll-icon';
import { useRolls } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';
import type { Roll } from '@/types/domain';

function sortRolls(rolls: Roll[]) {
  return [...rolls].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function RollSection({
  title,
  subtitle,
  rolls,
}: {
  title: string;
  subtitle: string;
  rolls: Roll[];
}) {
  if (rolls.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{rolls.length}</Text>
      </View>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {sortRolls(rolls).map((roll) => (
        <Link
          asChild
          key={roll.id}
          href={`/rolls/${roll.id}`}
        >
          <Pressable style={styles.rollCard}>
            <View style={styles.rollGlyph}>
              <FilmRollIcon size={30} />
            </View>
            <View style={styles.rollCopy}>
              <Text style={styles.rollNickname}>{roll.nickname ?? 'Untitled Roll'}</Text>
              <View style={styles.rollMetaBlock}>
                <Text style={styles.rollMetaLine}>{roll.filmStock}</Text>
                <Text style={styles.rollMetaLine}>{roll.camera}</Text>
              </View>
            </View>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

export default function RollsScreen() {
  const insets = useSafeAreaInsets();
  const { rolls, groupedRolls, loading, error } = useRolls();

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
          <Text style={styles.heading}>Rolls</Text>
          <Text style={styles.subheading}>Active, finished, and archived rolls live here.</Text>
        </View>
        <Link
          href="/rolls/new"
          style={styles.createLink}
        >
          New Roll
        </Link>
      </View>

      {loading ? <Text style={styles.metaText}>Loading rolls...</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!loading && rolls.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No rolls yet</Text>
          <Text style={styles.emptyText}>Create your first roll to start organizing exposures.</Text>
        </View>
      ) : null}

      <RollSection
        title="Active"
        subtitle="Rolls you are currently shooting."
        rolls={groupedRolls.active}
      />
      <RollSection
        title="Finished"
        subtitle="Completed rolls waiting for reference or export."
        rolls={groupedRolls.finished}
      />
      <RollSection
        title="Archived"
        subtitle="Older rolls kept for long-term browsing."
        rolls={groupedRolls.archived}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  subheading: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  createLink: {
    color: colors.background.surface,
    backgroundColor: colors.text.accent,
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCard: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCount: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  rollCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    padding: 16,
  },
  rollGlyph: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rollCopy: {
    flex: 1,
    gap: 4,
  },
  rollNickname: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  rollMetaBlock: {
    gap: 2,
    paddingLeft: 8,
  },
  rollMetaLine: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 18,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
});
