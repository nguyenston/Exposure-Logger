import type { Exposure } from '@/types/domain';

export type CreateExposureInput = Omit<
  Exposure,
  'id' | 'createdAt' | 'updatedAt' | 'sequenceNumber'
> & {
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
