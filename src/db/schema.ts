import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const rollsTable = sqliteTable('rolls', {
  id: text('id').primaryKey(),
  nickname: text('nickname'),
  camera: text('camera').notNull(),
  filmStock: text('film_stock').notNull(),
  nativeIso: integer('native_iso'),
  shotIso: integer('shot_iso'),
  notes: text('notes'),
  status: text('status').notNull().default('active'),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const exposuresTable = sqliteTable('exposures', {
  id: text('id').primaryKey(),
  rollId: text('roll_id')
    .notNull()
    .references(() => rollsTable.id, { onDelete: 'cascade' }),
  sequenceNumber: integer('sequence_number').notNull(),
  fStop: text('f_stop').notNull(),
  shutterSpeed: text('shutter_speed').notNull(),
  lens: text('lens'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  locationAccuracy: real('location_accuracy'),
  capturedAt: text('captured_at').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const gearRegistryTable = sqliteTable('gear_registry', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['camera', 'lens', 'film'] }).notNull(),
  name: text('name').notNull(),
  nativeIso: integer('native_iso'),
  focalLength: text('focal_length'),
  maxAperture: text('max_aperture'),
  mount: text('mount'),
  serialOrNickname: text('serial_or_nickname'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const appSettingsTable = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const schema = {
  rollsTable,
  exposuresTable,
  gearRegistryTable,
  appSettingsTable,
};
