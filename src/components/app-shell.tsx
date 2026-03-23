import { PropsWithChildren, useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export function AppShell({ children }: PropsWithChildren) {
  useEffect(() => {
    if (Platform.OS === 'web' || process.env.NODE_ENV === 'test') {
      return;
    }

    void import('@/db/bootstrap').then(({ initializeDatabase }) => {
      initializeDatabase();
    });
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      {children}
    </>
  );
}
