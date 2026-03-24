export type ExposureStopStep = '1' | '1/2' | '1/3';
export type LibraryExportScope = 'finished_only' | 'finished_and_archived';
export type VoiceTranscriptApplyMode = 'auto_apply' | 'review_before_apply';

export type ExposureDefaultsSettings = {
  defaultFStopFromPrevious: boolean;
  defaultShutterSpeedFromPrevious: boolean;
  defaultLensFromPrevious: boolean;
  defaultTimestampToNow: boolean;
  defaultLocationEnabled: boolean;
  defaultLocationToCurrent: boolean;
  exposureStopStep: ExposureStopStep;
  voiceTranscriptApplyMode: VoiceTranscriptApplyMode;
};

export type ExportSettings = {
  libraryExportScope: LibraryExportScope;
  autoArchiveAfterLibraryExport: boolean;
};

export type AppSettings = ExposureDefaultsSettings & ExportSettings;

export const defaultAppSettings: AppSettings = {
  defaultFStopFromPrevious: true,
  defaultShutterSpeedFromPrevious: true,
  defaultLensFromPrevious: true,
  defaultTimestampToNow: true,
  defaultLocationEnabled: true,
  defaultLocationToCurrent: true,
  exposureStopStep: '1/3',
  voiceTranscriptApplyMode: 'auto_apply',
  libraryExportScope: 'finished_only',
  autoArchiveAfterLibraryExport: true,
};

export const defaultExposureDefaultsSettings: ExposureDefaultsSettings = {
  defaultFStopFromPrevious: defaultAppSettings.defaultFStopFromPrevious,
  defaultShutterSpeedFromPrevious: defaultAppSettings.defaultShutterSpeedFromPrevious,
  defaultLensFromPrevious: defaultAppSettings.defaultLensFromPrevious,
  defaultTimestampToNow: defaultAppSettings.defaultTimestampToNow,
  defaultLocationEnabled: defaultAppSettings.defaultLocationEnabled,
  defaultLocationToCurrent: defaultAppSettings.defaultLocationToCurrent,
  exposureStopStep: defaultAppSettings.exposureStopStep,
  voiceTranscriptApplyMode: defaultAppSettings.voiceTranscriptApplyMode,
};

export const defaultExportSettings: ExportSettings = {
  libraryExportScope: defaultAppSettings.libraryExportScope,
  autoArchiveAfterLibraryExport: defaultAppSettings.autoArchiveAfterLibraryExport,
};
