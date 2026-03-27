export type RollStatus = 'active' | 'finished' | 'archived';
export type GearType = 'camera' | 'lens' | 'film';

export type Roll = {
  id: string;
  nickname: string | null;
  camera: string;
  filmStock: string;
  nativeIso: number | null;
  shotIso: number | null;
  notes: string | null;
  status: RollStatus;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Exposure = {
  id: string;
  rollId: string;
  sequenceNumber: number;
  fStop: string;
  shutterSpeed: string;
  lens: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  capturedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GearRegistryItem = {
  id: string;
  type: GearType;
  name: string;
  nativeIso: number | null;
  focalLength: string | null;
  maxAperture: string | null;
  mount: string | null;
  serialOrNickname: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
