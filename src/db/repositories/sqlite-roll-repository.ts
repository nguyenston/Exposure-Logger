import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { mapRollRow, toRollInsert } from '@/db/mappers';
import { rollsTable } from '@/db/schema';
import type { CreateRollInput, RollRepository } from '@/db/repositories/roll-repository';
import { createId } from '@/lib/id';
import { nowIsoString } from '@/lib/time';

export class SQLiteRollRepository implements RollRepository {
  constructor(private readonly database = db) {}

  async list() {
    const rows = await this.database.select().from(rollsTable);
    return rows.map(mapRollRow);
  }

  async getById(id: string) {
    const rows = await this.database.select().from(rollsTable).where(eq(rollsTable.id, id));
    const row = rows[0];

    return row ? mapRollRow(row) : null;
  }

  async create(input: CreateRollInput) {
    const timestamp = input.createdAt ?? nowIsoString();
    const id = input.id ?? createId('roll');

    await this.database.insert(rollsTable).values(
      toRollInsert({
        id,
        nickname: input.nickname,
        camera: input.camera,
        filmStock: input.filmStock,
        nativeIso: input.nativeIso,
        shotIso: input.shotIso,
        notes: input.notes,
        status: input.status ?? 'active',
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        createdAt: timestamp,
        updatedAt: input.updatedAt ?? timestamp,
      }),
    );

    const created = await this.getById(id);
    if (!created) {
      throw new Error(`Failed to create roll ${id}`);
    }

    return created;
  }

  async update(id: string, input: Partial<CreateRollInput>) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Roll not found: ${id}`);
    }

    await this.database
      .update(rollsTable)
      .set({
        nickname: input.nickname ?? existing.nickname,
        camera: input.camera ?? existing.camera,
        filmStock: input.filmStock ?? existing.filmStock,
        nativeIso: input.nativeIso ?? existing.nativeIso,
        shotIso: input.shotIso ?? existing.shotIso,
        notes: input.notes ?? existing.notes,
        status: input.status ?? existing.status,
        startedAt: input.startedAt ?? existing.startedAt,
        finishedAt: input.finishedAt ?? existing.finishedAt,
        updatedAt: input.updatedAt ?? nowIsoString(),
      })
      .where(eq(rollsTable.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Failed to update roll ${id}`);
    }

    return updated;
  }

  async delete(id: string) {
    await this.database.delete(rollsTable).where(eq(rollsTable.id, id));
  }
}

export const rollRepository = new SQLiteRollRepository();
