import type { GearRegistryItem, GearType } from '@/types/domain';

export type CreateGearInput = {
  type: GearType;
  name: string;
  nickname?: string | null;
  nativeIso?: number | null;
  focalLength?: string | null;
  maxAperture?: string | null;
  mount?: string | null;
  serialOrNickname?: string | null;
  notes?: string | null;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface GearRepository {
  listByType(type: GearType): Promise<GearRegistryItem[]>;
  getById(id: string): Promise<GearRegistryItem | null>;
  create(input: CreateGearInput): Promise<GearRegistryItem>;
  update(id: string, input: Partial<CreateGearInput>): Promise<GearRegistryItem>;
  delete(id: string): Promise<void>;
}
