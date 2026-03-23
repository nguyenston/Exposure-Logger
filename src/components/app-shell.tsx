import { PropsWithChildren, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme/colors';

export function AppShell({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(Platform.OS === 'web' || process.env.NODE_ENV === 'test');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || process.env.NODE_ENV === 'test') {
      return;
    }

    let active = true;

    void import('@/db/bootstrap')
      .then(({ initializeDatabase }) => {
        initializeDatabase();
        if (active) {
          setReady(true);
        }
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error ? nextError.message : 'Failed to initialize the database.',
        );
      });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <>
        <StatusBar style="dark" />
        <View style={styles.stateScreen}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <ActivityIndicator
                color={colors.text.accent}
                size="large"
              />
              <Text style={styles.metaText}>Preparing local database...</Text>
            </>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  stateScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: colors.background.canvas,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 15,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 15,
    textAlign: 'center',
  },
});
