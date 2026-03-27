import { router, Stack, usePathname } from 'expo-router';
import { Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { FilmRollIcon } from '@/components/film-roll-icon';
import { GearIcon } from '@/components/gear-icon';
import { InfoIcon } from '@/components/info-icon';
import { colors } from '@/theme/colors';

function getHelpTopic(pathname: string) {
  if (/^\/rolls\/[^/]+$/.test(pathname)) {
    return 'roll-detail';
  }

  if (pathname === '/exposures/new') {
    return 'new-exposure';
  }

  if (/^\/exposures\/[^/]+\/edit$/.test(pathname)) {
    return 'edit-exposure';
  }

  if (pathname === '/gear') {
    return 'gear-registry';
  }

  return null;
}

export default function RootLayout() {
  const pathname = usePathname();
  const showSettingsButton = pathname !== '/settings';
  const helpTopic = getHelpTopic(pathname);

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
                <>
                  {helpTopic ? (
                    <Pressable
                      accessibilityLabel="Open screen help"
                      hitSlop={8}
                      onPress={() => router.push(`/help/${helpTopic}`)}
                      style={{ padding: 4, marginRight: showSettingsButton ? 8 : 0 }}
                    >
                      <InfoIcon />
                    </Pressable>
                  ) : null}
                  {showSettingsButton ? (
                    <Pressable
                      accessibilityLabel="Open settings"
                      hitSlop={8}
                      onPress={() => router.push('/settings')}
                      style={{ padding: 4 }}
                    >
                      <GearIcon />
                    </Pressable>
                  ) : null}
                </>
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
              name="help/[topic]"
              options={{ title: 'How This Screen Works' }}
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
