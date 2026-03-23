export type ExposureStopStep = '1' | '1/2' | '1/3';

export type ExposureDefaultsSettings = {
  defaultFStopFromPrevious: boolean;
  defaultShutterSpeedFromPrevious: boolean;
  defaultLensFromPrevious: boolean;
  defaultTimestampToNow: boolean;
  defaultLocationEnabled: boolean;
  defaultLocationToCurrent: boolean;
  exposureStopStep: ExposureStopStep;
};

export const defaultExposureDefaultsSettings: ExposureDefaultsSettings = {
  defaultFStopFromPrevious: true,
  defaultShutterSpeedFromPrevious: true,
  defaultLensFromPrevious: true,
  defaultTimestampToNow: true,
  defaultLocationEnabled: true,
  defaultLocationToCurrent: true,
  exposureStopStep: '1/3',
};
