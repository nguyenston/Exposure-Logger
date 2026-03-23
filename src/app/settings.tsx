import { Link } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';
import { colors } from '@/theme/colors';
import type { ExposureStopStep } from '@/types/settings';

const stopStepOptions: ExposureStopStep[] = ['1', '1/2', '1/3'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, loading, error, updateSettings } = useExposureDefaultsSettings();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: 24 + insets.bottom,
        },
      ]}
    >
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.meta}>
        Tune default exposure behavior here. Phase 4 stores these settings locally and applies them
        when you create new exposures.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Exposure Defaults</Text>
        {loading ? <Text style={styles.meta}>Loading settings...</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Reuse previous f-stop</Text>
            <Text style={styles.settingHint}>New exposures inherit the previous frame aperture.</Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ defaultFStopFromPrevious: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultFStopFromPrevious}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Reuse previous shutter speed</Text>
            <Text style={styles.settingHint}>Keep repeated metering changes fast.</Text>
          </View>
          <Switch
            onValueChange={(value) =>
              void updateSettings({ defaultShutterSpeedFromPrevious: value })
            }
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultShutterSpeedFromPrevious}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Reuse previous lens</Text>
            <Text style={styles.settingHint}>Useful when you stay on the same lens for a roll.</Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ defaultLensFromPrevious: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultLensFromPrevious}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Stop increments</Text>
            <Text style={styles.settingHint}>
              F-stop and shutter pickers step by full, half, or third stops.
            </Text>
          </View>
        </View>
        <View style={styles.segmentedControl}>
          {stopStepOptions.map((option) => (
            <Text
              key={option}
              onPress={() => void updateSettings({ exposureStopStep: option })}
              style={[
                styles.segmentedOption,
                settings.exposureStopStep === option ? styles.segmentedOptionActive : null,
                settings.exposureStopStep === option
                  ? styles.segmentedOptionTextActive
                  : styles.segmentedOptionText,
              ]}
            >
              {option} stop
            </Text>
          ))}
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Default timestamp to now</Text>
            <Text style={styles.settingHint}>New exposures start with the current device time.</Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ defaultTimestampToNow: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultTimestampToNow}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Enable location section by default</Text>
            <Text style={styles.settingHint}>Location fields open by default on new exposures.</Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ defaultLocationEnabled: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultLocationEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Default location to current GPS</Text>
            <Text style={styles.settingHint}>
              When location is enabled by default, fetch current coordinates automatically.
            </Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ defaultLocationToCurrent: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.defaultLocationToCurrent}
          />
        </View>
      </View>

      <Link
        href="/gear"
        style={styles.link}
      >
        Open Gear Registry
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
    backgroundColor: colors.background.canvas,
  },
  heading: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
    padding: 18,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: colors.text.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  settingHint: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: colors.text.destructive,
    fontSize: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentedOption: {
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedOptionActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  segmentedOptionText: {
    color: colors.text.primary,
  },
  segmentedOptionTextActive: {
    color: colors.background.surface,
  },
});
