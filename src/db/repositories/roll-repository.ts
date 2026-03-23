import type { Roll } from '@/types/domain';

export type CreateRollInput = Omit<Roll, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'nickname'> & {
  id?: string;
  nickname?: Roll['nickname'];
  status?: Roll['status'];
  createdAt?: string;
  updatedAt?: string;
};

export interface RollRepository {
  list(): Promise<Roll[]>;
  getById(id: string): Promise<Roll | null>;
  create(input: CreateRollInput): Promise<Roll>;
  update(id: string, input: Partial<CreateRollInput>): Promise<Roll>;
  delete(id: string): Promise<void>;
}
