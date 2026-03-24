import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exportLibraryCsv } from '@/services/export/csv-export';
import { useExposureDefaultsSettings } from '@/features/settings/use-exposure-defaults-settings';
import { colors } from '@/theme/colors';
import type { ExposureStopStep, LibraryExportScope, VoiceTranscriptApplyMode } from '@/types/settings';

const stopStepOptions: ExposureStopStep[] = ['1', '1/2', '1/3'];
const libraryExportScopeOptions: { label: string; value: LibraryExportScope }[] = [
  {
    label: 'Finished only',
    value: 'finished_only',
  },
  {
    label: 'Finished + archived',
    value: 'finished_and_archived',
  },
];
const voiceTranscriptApplyModeOptions: { label: string; value: VoiceTranscriptApplyMode }[] = [
  {
    label: 'Auto-apply',
    value: 'auto_apply',
  },
  {
    label: 'Review first',
    value: 'review_before_apply',
  },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, loading, error, updateSettings } = useExposureDefaultsSettings();
  const [exportingLibrary, setExportingLibrary] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportLibrary = async () => {
    setExportingLibrary(true);
    setExportMessage(null);
    setExportError(null);

    try {
      const result = await exportLibraryCsv(settings);
      const archivedSuffix =
        result.autoArchivedRollIds.length > 0
          ? ` Auto-archived ${result.autoArchivedRollIds.length} finished roll${result.autoArchivedRollIds.length === 1 ? '' : 's'}.`
          : '';
      setExportMessage(
        `Shared CSV for ${result.exportedRollIds.length} roll${result.exportedRollIds.length === 1 ? '' : 's'} (${result.exportedRows} row${result.exportedRows === 1 ? '' : 's'}).${archivedSuffix}`,
      );
    } catch (nextError) {
      setExportError(nextError instanceof Error ? nextError.message : 'Failed to export library CSV.');
    } finally {
      setExportingLibrary(false);
    }
  };

  return (
    <ScrollView
      style={[
        styles.container,
        {
          paddingBottom: 0,
        },
      ]}
      contentContainerStyle={{
        padding: 24,
        paddingBottom: 24 + insets.bottom,
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
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
            <Pressable
              key={option}
              onPress={() => void updateSettings({ exposureStopStep: option })}
              style={[
                styles.segmentedOption,
                settings.exposureStopStep === option ? styles.segmentedOptionActive : null,
              ]}
            >
              <View style={styles.segmentedOptionContent}>
                {settings.exposureStopStep === option ? (
                  <Text style={styles.segmentedOptionCheck}>✓</Text>
                ) : null}
                <Text
                  style={
                    settings.exposureStopStep === option
                      ? styles.segmentedOptionLabelActive
                      : styles.segmentedOptionLabel
                  }
                >
                  {option} stop
                </Text>
              </View>
            </Pressable>
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

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Voice transcript apply mode</Text>
            <Text style={styles.settingHint}>
              Auto-apply recognized fields or require transcript review first.
            </Text>
          </View>
        </View>
        <View style={styles.segmentedControl}>
          {voiceTranscriptApplyModeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => void updateSettings({ voiceTranscriptApplyMode: option.value })}
              style={[
                styles.segmentedOption,
                settings.voiceTranscriptApplyMode === option.value ? styles.segmentedOptionActive : null,
              ]}
            >
              <View style={styles.segmentedOptionContent}>
                {settings.voiceTranscriptApplyMode === option.value ? (
                  <Text style={styles.segmentedOptionCheck}>✓</Text>
                ) : null}
                <Text
                  style={
                    settings.voiceTranscriptApplyMode === option.value
                      ? styles.segmentedOptionLabelActive
                      : styles.segmentedOptionLabel
                  }
                >
                  {option.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Link
        href="/gear"
        style={styles.link}
      >
        Open Gear Registry
      </Link>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Export</Text>
        <Text style={styles.meta}>
          Whole-library export defaults to finished rolls only. Successful whole-library export can
          auto-archive those rolls.
        </Text>
        <Text style={styles.settingHint}>
          Per-roll export lives on each roll detail screen. Whole-library export shares one flattened CSV file.
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Whole-library export scope</Text>
            <Text style={styles.settingHint}>Choose which roll statuses are included in bulk export.</Text>
          </View>
        </View>
        <View style={styles.segmentedControl}>
          {libraryExportScopeOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => void updateSettings({ libraryExportScope: option.value })}
              style={[
                styles.segmentedOption,
                settings.libraryExportScope === option.value ? styles.segmentedOptionActive : null,
              ]}
            >
              <View style={styles.segmentedOptionContent}>
                {settings.libraryExportScope === option.value ? (
                  <Text style={styles.segmentedOptionCheck}>✓</Text>
                ) : null}
                <Text
                  style={
                    settings.libraryExportScope === option.value
                      ? styles.segmentedOptionLabelActive
                      : styles.segmentedOptionLabel
                  }
                >
                  {option.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>Auto-archive after library export</Text>
            <Text style={styles.settingHint}>
              Archive exported finished rolls only after a successful whole-library export.
            </Text>
          </View>
          <Switch
            onValueChange={(value) => void updateSettings({ autoArchiveAfterLibraryExport: value })}
            trackColor={{ false: colors.border.subtle, true: colors.text.accent }}
            value={settings.autoArchiveAfterLibraryExport}
          />
        </View>

        {exportMessage ? <Text style={styles.successText}>{exportMessage}</Text> : null}
        {exportError ? <Text style={styles.errorText}>{exportError}</Text> : null}

        <Pressable
          onPress={() => void handleExportLibrary()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {exportingLibrary ? 'Exporting...' : 'Export Library CSV'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: colors.text.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.background.surface,
    fontSize: 14,
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
  successText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentedOption: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.canvas,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  segmentedOptionActive: {
    borderColor: colors.text.accent,
    backgroundColor: colors.text.accent,
  },
  segmentedOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedOptionCheck: {
    color: colors.background.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedOptionLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedOptionLabelActive: {
    color: colors.background.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
