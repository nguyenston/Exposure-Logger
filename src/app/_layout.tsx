import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { FilmRollIcon } from '@/components/film-roll-icon';
import { GearIcon } from '@/components/gear-icon';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell>
          <Stack
            screenOptions={{
              headerTitleAlign: 'center',
              headerStyle: {
                backgroundColor: colors.background.surface,
              },
              headerRight: () => (
                <Pressable
                  accessibilityLabel="Open settings"
                  hitSlop={8}
                  onPress={() => router.push('/settings')}
                  style={{ padding: 4 }}
                >
                  <GearIcon />
                </Pressable>
              ),
              contentStyle: {
                backgroundColor: colors.background.canvas,
              },
            }}
          >
            <Stack.Screen
              name="index"
              options={{ title: 'Exposure Logger', headerBackVisible: false }}
            />
            <Stack.Screen
              name="rolls/index"
              options={{ title: 'Rolls' }}
            />
            <Stack.Screen
              name="rolls/[rollId]/index"
              options={{
                title: 'Roll Detail',
                headerLeft: () => (
                  <Pressable
                    accessibilityLabel="Open roll list"
                    hitSlop={8}
                    onPress={() => router.push('/rolls')}
                    style={{ padding: 4 }}
                  >
                    <FilmRollIcon size={22} />
                  </Pressable>
                ),
              }}
            />
            <Stack.Screen
              name="rolls/new"
              options={{ title: 'New Roll' }}
            />
            <Stack.Screen
              name="rolls/[rollId]/edit"
              options={{ title: 'Edit Roll' }}
            />
            <Stack.Screen
              name="exposures/new"
              options={{ title: 'Quick Add Exposure' }}
            />
            <Stack.Screen
              name="exposures/[exposureId]/edit"
              options={{ title: 'Edit Exposure' }}
            />
            <Stack.Screen
              name="gear/index"
              options={{ title: 'Gear Registry' }}
            />
            <Stack.Screen
              name="settings"
              options={{ title: 'Settings' }}
            />
          </Stack>
        </AppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
