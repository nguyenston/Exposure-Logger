import { Redirect } from 'expo-router';

import { pickHomeRoll } from '@/features/rolls/roll-utils';
import { useRolls } from '@/features/rolls/use-rolls';
import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';

export default function HomeScreen() {
  const { rolls, loading } = useRolls();
  const { settings, loading: settingsLoading } = useExposureDefaultsSettings();
  const defaultRoll = pickHomeRoll(rolls, settings.lastOpenedRollId);

  if (!loading && !settingsLoading) {
    return (
      <Redirect
        href={
          defaultRoll
            ? `/rolls?openRollId=${defaultRoll.id}`
            : '/rolls'
        }
      />
    );
  }

  return null;
}
