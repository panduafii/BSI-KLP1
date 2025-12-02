import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

import options from '../src/database/typeorm.config';
import { Room } from '../src/modules/rooms/room.entity';

loadEnv();

const dataSource = new DataSource({
  ...(options as any),
  entities: [Room]
});

interface RawRoom {
  code?: string;
  roomCode?: string;
  room_id?: string;
  room?: string;
  name?: string;
  room_name?: string;
  capacity?: number | string;
  seat_capacity?: number | string;
  location?: string;
  building?: string;
  features?: Record<string, any>;
  [key: string]: any;
}

async function main() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(Room);

  const records = loadRecords();
  if (!records.length) {
    console.log('No room data found in reference-data/*.');
    return;
  }

  let inserted = 0;
  for (const rec of records) {
    const code = rec.code || rec.roomCode || rec.room_id || rec.room;
    const name = rec.name || rec.room_name || rec.room || code;
    if (!code || !name) continue;

    const capacityRaw = rec.capacity ?? rec.seat_capacity;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;
    const location = rec.location || rec.building;
    const features = rec.features || {};

    const existing = await repo.findOne({ where: { code } });
    if (existing) {
      await repo.update({ code }, { name, capacity, location, features, isActive: true });
      continue;
    }

    const room = repo.create({ code, name, capacity, location, features });
    await repo.save(room);
    inserted += 1;
  }

  console.log(`Seed complete. Inserted: ${inserted}, total rows: ${await repo.count()}`);
}

function loadRecords(): RawRoom[] {
  const base = process.cwd();
  const candidates = [
    'reference-data/reference_data.json',
    'reference-data/all_schedule.json',
    'reference-data/all_schedule.csv'
  ];

  for (const rel of candidates) {
    const full = join(base, rel);
    if (!existsSync(full)) continue;

    if (full.endsWith('.json')) {
      try {
        const parsed = JSON.parse(readFileSync(full, 'utf-8'));
        if (Array.isArray(parsed)) return parsed as RawRoom[];
        if (Array.isArray(parsed?.data)) return parsed.data as RawRoom[];
      } catch (err) {
        console.warn(`Failed to parse ${rel}:`, err);
      }
    }

    if (full.endsWith('.csv')) {
      const raw = readFileSync(full, 'utf-8');
      const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
      const headers = headerLine.split(',').map((h) => h.trim());
      return lines.map((line) => {
        const cols = line.split(',');
        const obj: RawRoom = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        return obj;
      });
    }
  }

  return [];
}

main()
  .then(() => dataSource.destroy())
  .catch((err) => {
    console.error(err);
    dataSource.destroy();
    process.exit(1);
  });
