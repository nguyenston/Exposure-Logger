import type { Exposure, GearRegistryItem, GearType, Roll, RollStatus } from '@/types/domain';

type Nullable<T> = T | null | undefined;

type RollRow = {
  id: string;
  nickname: Nullable<string>;
  camera: string;
  filmStock: string;
  nativeIso: Nullable<number>;
  shotIso: Nullable<number>;
  notes: Nullable<string>;
  status: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
  createdAt: string;
  updatedAt: string;
};

type RollInsert = {
  id: string;
  nickname?: string | null;
  camera: string;
  filmStock: string;
  nativeIso?: number | null;
  shotIso?: number | null;
  notes?: string | null;
  status: RollStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExposureRow = {
  id: string;
  rollId: string;
  sequenceNumber: number;
  fStop: string;
  shutterSpeed: string;
  lens: Nullable<string>;
  latitude: Nullable<number>;
  longitude: Nullable<number>;
  locationAccuracy: Nullable<number>;
  capturedAt: string;
  notes: Nullable<string>;
  createdAt: string;
  updatedAt: string;
};

type ExposureInsert = {
  id: string;
  rollId: string;
  sequenceNumber: number;
  fStop: string;
  shutterSpeed: string;
  lens?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  capturedAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type GearRegistryRow = {
  id: string;
  type: string;
  name: string;
  nickname: Nullable<string>;
  nativeIso: Nullable<number>;
  focalLength: Nullable<string>;
  maxAperture: Nullable<string>;
  mount: Nullable<string>;
  serialOrNickname: Nullable<string>;
  notes: Nullable<string>;
  createdAt: string;
  updatedAt: string;
};

type GearRegistryInsert = {
  id: string;
  type: GearType;
  name: string;
  nickname?: string | null;
  nativeIso?: number | null;
  focalLength?: string | null;
  maxAperture?: string | null;
  mount?: string | null;
  serialOrNickname?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function mapRollRow(row: RollRow): Roll {
  return {
    id: row.id,
    nickname: row.nickname ?? null,
    camera: row.camera,
    filmStock: row.filmStock,
    nativeIso: row.nativeIso ?? null,
    shotIso: row.shotIso ?? null,
    notes: row.notes ?? null,
    status: row.status as RollStatus,
    startedAt: row.startedAt ?? null,
    finishedAt: row.finishedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toRollInsert(row: RollInsert) {
  return {
    id: row.id,
    nickname: row.nickname ?? null,
    camera: row.camera,
    filmStock: row.filmStock,
    nativeIso: row.nativeIso ?? null,
    shotIso: row.shotIso ?? null,
    notes: row.notes ?? null,
    status: row.status,
    startedAt: row.startedAt ?? null,
    finishedAt: row.finishedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapExposureRow(row: ExposureRow): Exposure {
  return {
    id: row.id,
    rollId: row.rollId,
    sequenceNumber: row.sequenceNumber,
    fStop: row.fStop,
    shutterSpeed: row.shutterSpeed,
    lens: row.lens ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    locationAccuracy: row.locationAccuracy ?? null,
    capturedAt: row.capturedAt,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toExposureInsert(row: ExposureInsert) {
  return {
    id: row.id,
    rollId: row.rollId,
    sequenceNumber: row.sequenceNumber,
    fStop: row.fStop,
    shutterSpeed: row.shutterSpeed,
    lens: row.lens ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    locationAccuracy: row.locationAccuracy ?? null,
    capturedAt: row.capturedAt,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapGearRegistryRow(row: GearRegistryRow): GearRegistryItem {
  return {
    id: row.id,
    type: row.type as GearType,
    name: row.name,
    nickname: row.nickname ?? null,
    nativeIso: row.nativeIso ?? null,
    focalLength: row.focalLength ?? null,
    maxAperture: row.maxAperture ?? null,
    mount: row.mount ?? null,
    serialOrNickname: row.serialOrNickname ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toGearRegistryInsert(row: GearRegistryInsert) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    nickname: row.nickname ?? null,
    nativeIso: row.nativeIso ?? null,
    focalLength: row.focalLength ?? null,
    maxAperture: row.maxAperture ?? null,
    mount: row.mount ?? null,
    serialOrNickname: row.serialOrNickname ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
