import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { schema } from '@/db/schema';

export const sqlite = openDatabaseSync('exposure-logger.db');

export const db = drizzle(sqlite, { schema });
