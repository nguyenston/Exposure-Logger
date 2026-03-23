import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { mapExposureRow, toExposureInsert } from '@/db/mappers';
import type { CreateExposureInput, ExposureRepository } from '@/db/repositories/exposure-repository';
import { exposuresTable } from '@/db/schema';
import { createId } from '@/lib/id';
import { nowIsoString } from '@/lib/time';

export class SQLiteExposureRepository implements ExposureRepository {
  constructor(private readonly database = db) {}

  async listByRollId(rollId: string) {
    const rows = await this.database
      .select()
      .from(exposuresTable)
      .where(eq(exposuresTable.rollId, rollId))
      .orderBy(asc(exposuresTable.sequenceNumber));

    return rows.map(mapExposureRow);
  }

  async getById(id: string) {
    const rows = await this.database.select().from(exposuresTable).where(eq(exposuresTable.id, id));
    const row = rows[0];

    return row ? mapExposureRow(row) : null;
  }

  async create(input: CreateExposureInput) {
    const timestamp = input.createdAt ?? nowIsoString();
    const id = input.id ?? createId('exp');
    const sequenceNumber = input.sequenceNumber ?? (await this.getNextSequenceNumber(input.rollId));

    await this.database.insert(exposuresTable).values(
      toExposureInsert({
        id,
        rollId: input.rollId,
        sequenceNumber,
        fStop: input.fStop,
        shutterSpeed: input.shutterSpeed,
        lens: input.lens,
        latitude: input.latitude,
        longitude: input.longitude,
        locationAccuracy: input.locationAccuracy,
        capturedAt: input.capturedAt,
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: input.updatedAt ?? timestamp,
      }),
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create exposure ${id}`);
    }

    return created;
  }

  async update(id: string, input: Partial<CreateExposureInput>) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Exposure not found: ${id}`);
    }

    await this.database
      .update(exposuresTable)
      .set({
        rollId: input.rollId ?? existing.rollId,
        sequenceNumber: input.sequenceNumber ?? existing.sequenceNumber,
        fStop: input.fStop ?? existing.fStop,
        shutterSpeed: input.shutterSpeed ?? existing.shutterSpeed,
        lens: input.lens ?? existing.lens,
        latitude: input.latitude ?? existing.latitude,
        longitude: input.longitude ?? existing.longitude,
        locationAccuracy: input.locationAccuracy ?? existing.locationAccuracy,
        capturedAt: input.capturedAt ?? existing.capturedAt,
        notes: input.notes ?? existing.notes,
        updatedAt: input.updatedAt ?? nowIsoString(),
      })
      .where(eq(exposuresTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Failed to update exposure ${id}`);
    }

    return updated;
  }

  async delete(id: string) {
    await this.database.delete(exposuresTable).where(eq(exposuresTable.id, id));
  }

  private async getNextSequenceNumber(rollId: string) {
    const rows = await this.database
      .select()
      .from(exposuresTable)
      .where(eq(exposuresTable.rollId, rollId))
      .orderBy(desc(exposuresTable.sequenceNumber));
    const latest = rows[0];

    return latest ? latest.sequenceNumber + 1 : 1;
  }
}

export const exposureRepository = new SQLiteExposureRepository();
