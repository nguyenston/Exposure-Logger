import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type PlaceholderCardProps = {
  title: string;
  description: string;
};

export function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Exposure Logger</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  eyebrow: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 22,
  },
});
