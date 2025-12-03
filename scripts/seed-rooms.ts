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
  dropdown_label?: string;
  attributes?: string[];
  detail_url?: string;
  area_id?: string;
  area_name?: string;
  [key: string]: any;
}

async function main() {
  const { rooms, areasFromSchedule } = loadRecords();
  if (!rooms.length) {
    console.log('No room data found in reference-data/*.');
    return;
  }

  if (process.env.DRY_RUN === '1') {
    console.log(`[DRY_RUN] Parsed ${rooms.length} rooms, ${areasFromSchedule.size} area mappings.`);
    const sample = rooms.slice(0, 3).map((r: RawRoom) => ({
      code: r.dropdown_label || r.label || r.code || r.room_id,
      name: r.name,
      capacity: r.capacity,
      area: r.area_name
    }));
    console.log('[DRY_RUN] Sample:', sample);
    return;
  }

  await dataSource.initialize();
  const repo = dataSource.getRepository(Room);

  let inserted = 0;
  for (const rec of rooms) {
    const code = rec.dropdown_label || rec.label || rec.code || rec.roomCode || rec.room_id || rec.room;
    const name = rec.name || rec.room_name || rec.room || code;
    if (!code || !name) continue;

    const capacityRaw = rec.capacity ?? rec.seat_capacity;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;
    const areaName = rec.area_name || areasFromSchedule.get(rec.room_id || '') || rec.location || rec.building;
    const features: Record<string, any> = {
      ...(rec.features || {}),
      externalRoomId: rec.room_id || rec.roomCode || rec.code || null,
      dropdownLabel: rec.dropdown_label || rec.label || null,
      attributes: rec.attributes || [],
      detailUrl: rec.detail_url || null,
      areaId: rec.area_id || null,
      areaName: areaName || null
    };
    const location = areaName || rec.location || rec.building;

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

function loadRecords(): { rooms: RawRoom[]; areasFromSchedule: Map<string, string> } {
  const base = process.cwd();
  const refJson = join(base, 'reference-data/reference_data.json');
  const scheduleJson = join(base, 'reference-data/all_schedule.json');
  const scheduleCsv = join(base, 'reference-data/all_schedule.csv');

  const rooms: RawRoom[] = [];
  const areaByRoomId = new Map<string, string>();

  if (existsSync(refJson)) {
    try {
      const parsed = JSON.parse(readFileSync(refJson, 'utf-8'));
      if (Array.isArray(parsed?.rooms)) {
        rooms.push(...(parsed.rooms as RawRoom[]));
      }
    } catch (err) {
      console.warn(`Failed to parse reference_data.json:`, err);
    }
  }

  const scheduleRecords: RawRoom[] = [];
  if (existsSync(scheduleJson)) {
    try {
      const parsed = JSON.parse(readFileSync(scheduleJson, 'utf-8'));
      if (Array.isArray(parsed)) {
        scheduleRecords.push(...parsed);
      }
    } catch (err) {
      console.warn(`Failed to parse all_schedule.json:`, err);
    }
  } else if (existsSync(scheduleCsv)) {
    const raw = readFileSync(scheduleCsv, 'utf-8');
    const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    scheduleRecords.push(
      ...lines.map((line) => {
        const cols = line.split(',');
        const obj: RawRoom = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        return obj;
      })
    );
  }

  // Map area_name from schedule to each room_id
  for (const rec of scheduleRecords) {
    const rid = rec.room_id || rec.room || rec.room_name;
    if (!rid) continue;
    if (rec.area_name && !areaByRoomId.has(rid)) {
      areaByRoomId.set(rid, rec.area_name);
    }
  }

  // Attach area info onto room records
  const roomsWithArea = rooms.map((room) => {
    const room_id = room.room_id || room.roomCode || room.code;
    const area_name = areaByRoomId.get(room_id || '') || room.area_name;
    return { ...room, room_id, area_name };
  });

  return { rooms: roomsWithArea, areasFromSchedule: areaByRoomId };
}

main()
  .then(() => {
    if (dataSource.isInitialized) {
      return dataSource.destroy();
    }
  })
  .catch((err) => {
    console.error(err);
    if (dataSource.isInitialized) {
      dataSource.destroy();
    }
    process.exit(1);
  });
