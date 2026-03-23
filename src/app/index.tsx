import { Redirect, Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pickDefaultRoll } from '@/features/rolls/roll-utils';
import { useRolls } from '@/features/rolls/use-rolls';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { rolls, loading, error } = useRolls();
  const defaultRoll = pickDefaultRoll(rolls);

  if (!loading && defaultRoll) {
    return <Redirect href={`/rolls/${defaultRoll.id}`} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom,
        },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Exposure Logger</Text>
        {loading ? <Text style={styles.body}>Loading your rolls...</Text> : null}
        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !defaultRoll ? (
          <>
            <Text style={styles.body}>No active roll to open yet.</Text>
            <Link
              href="/rolls"
              style={styles.link}
            >
              Go to roll list
            </Link>
            <Link
              href="/rolls/new"
              style={styles.secondaryLink}
            >
              Create your first roll
            </Link>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  card: {
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 20,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  body: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: colors.text.destructive,
    fontSize: 14,
  },
  link: {
    color: colors.text.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryLink: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
