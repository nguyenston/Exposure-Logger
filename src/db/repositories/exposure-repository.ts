import type { Exposure } from '@/types/domain';

export type CreateExposureInput = {
  rollId: string;
  fStop: string;
  shutterSpeed: string;
  lens?: string | null;
  flash?: string | null;
  flashPower?: string | null;
  ndStops?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
  capturedAt: string;
  capturedAtOffset?: string | null;
  notes?: string | null;
  id?: string;
  sequenceNumber?: number;
  createdAt?: string;
  updatedAt?: string;
};

export interface ExposureRepository {
  listByRollId(rollId: string): Promise<Exposure[]>;
  getById(id: string): Promise<Exposure | null>;
  create(input: CreateExposureInput): Promise<Exposure>;
  update(id: string, input: Partial<CreateExposureInput>): Promise<Exposure>;
  delete(id: string): Promise<void>;
}
