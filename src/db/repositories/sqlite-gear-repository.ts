import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { mapGearRegistryRow, toGearRegistryInsert } from '@/db/mappers';
import type { CreateGearInput, GearRepository } from '@/db/repositories/gear-repository';
import { gearRegistryTable } from '@/db/schema';
import { createId } from '@/lib/id';
import { nowIsoString } from '@/lib/time';

export class SQLiteGearRepository implements GearRepository {
  constructor(private readonly database = db) {}

  async listByType(type: CreateGearInput['type']) {
    const rows = await this.database
      .select()
      .from(gearRegistryTable)
      .where(eq(gearRegistryTable.type, type))
      .orderBy(asc(gearRegistryTable.name));

    return rows.map(mapGearRegistryRow);
  }

  async getById(id: string) {
    const rows = await this.database.select().from(gearRegistryTable).where(eq(gearRegistryTable.id, id));
    const row = rows[0];

    return row ? mapGearRegistryRow(row) : null;
  }

  async create(input: CreateGearInput) {
    const timestamp = input.createdAt ?? nowIsoString();
    const id = input.id ?? createId('gear');

    await this.database.insert(gearRegistryTable).values(
      toGearRegistryInsert({
        id,
        type: input.type,
        name: input.name,
        nickname: input.nickname,
        nativeIso: input.nativeIso,
        focalLength: input.focalLength,
        maxAperture: input.maxAperture,
        mount: input.mount,
        serialOrNickname: input.serialOrNickname,
        notes: input.notes,
        createdAt: timestamp,
        updatedAt: input.updatedAt ?? timestamp,
      }),
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create gear item ${id}`);
    }

    return created;
  }

  async update(id: string, input: Partial<CreateGearInput>) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Gear item not found: ${id}`);
    }

    await this.database
      .update(gearRegistryTable)
      .set({
        type: input.type ?? existing.type,
        name: input.name ?? existing.name,
        nickname: input.nickname ?? existing.nickname,
        nativeIso: input.nativeIso ?? existing.nativeIso,
        focalLength: input.focalLength ?? existing.focalLength,
        maxAperture: input.maxAperture ?? existing.maxAperture,
        mount: input.mount ?? existing.mount,
        serialOrNickname: input.serialOrNickname ?? existing.serialOrNickname,
        notes: input.notes ?? existing.notes,
        updatedAt: input.updatedAt ?? nowIsoString(),
      })
      .where(eq(gearRegistryTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Failed to update gear item ${id}`);
    }

    return updated;
  }

  async delete(id: string) {
    await this.database.delete(gearRegistryTable).where(eq(gearRegistryTable.id, id));
  }

  async findByTypeAndName(type: CreateGearInput['type'], name: string) {
    const rows = await this.database
      .select()
      .from(gearRegistryTable)
      .where(and(eq(gearRegistryTable.type, type), eq(gearRegistryTable.name, name)));
    const row = rows[0];

    return row ? mapGearRegistryRow(row) : null;
  }
}

export const gearRepository = new SQLiteGearRepository();
