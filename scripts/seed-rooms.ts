import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';

import options from '../src/database/typeorm.config';
import { Area } from '../src/modules/areas/area.entity';
import { Room } from '../src/modules/rooms/room.entity';

loadEnv();

const dataSource = new DataSource({
  ...(options as any),
  entities: [Area, Room]
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

interface RawArea {
  value?: string;
  text?: string;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

async function main() {
  const { rooms, areasFromSchedule, areaCatalog } = loadRecords();
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
  const roomRepo = dataSource.getRepository(Room);
  const areaRepo = dataSource.getRepository(Area);
  const areaCache = new Map<string, Area>();

  let inserted = 0;
  for (const rec of rooms) {
    const code = rec.dropdown_label || rec.label || rec.code || rec.roomCode || rec.room_id || rec.room;
    const name = rec.name || rec.room_name || rec.room || code;
    if (!code || !name) continue;

    const capacityRaw = rec.capacity ?? rec.seat_capacity;
    const capacity = capacityRaw ? Number(capacityRaw) : 0;
    const areaInfo = areasFromSchedule.get(rec.room_id || '') || {};
    const catalogById = areaCatalog.byId;
    const catalogByName = areaCatalog.byName;

    const areaCandidateById = areaInfo.areaId ? catalogById.get(areaInfo.areaId) : undefined;
    const areaCandidateByName = areaInfo.areaName
      ? catalogByName.get(areaInfo.areaName.toLowerCase())
      : undefined;
    const areaCandidate = areaCandidateById || areaCandidateByName;

    const areaCode = areaCandidate?.code || (areaInfo.areaName ? slugify(areaInfo.areaName) : undefined);
    const areaName = areaCandidate?.name || areaInfo.areaName || rec.location || rec.building;
    let areaId: string | undefined;

    if (areaCode && areaName) {
      if (areaCache.has(areaCode)) {
        areaId = areaCache.get(areaCode)?.id;
      } else {
        let area = await areaRepo.findOne({ where: { code: areaCode } });
        if (!area) {
          area = areaRepo.create({ code: areaCode, name: areaName });
          await areaRepo.save(area);
        } else if (area.name !== areaName) {
          area.name = areaName;
          await areaRepo.save(area);
        }
        areaCache.set(areaCode, area);
        areaId = area.id;
      }
    }

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

    const existing = await roomRepo.findOne({ where: { code } });
    if (existing) {
      await roomRepo.update(
        { code },
        {
          name,
          capacity,
          location,
          features,
          isActive: true,
          areaId
        }
      );
      continue;
    }

    const room = roomRepo.create({ code, name, capacity, location, features, areaId });
    await roomRepo.save(room);
    inserted += 1;
  }

  console.log(`Seed complete. Inserted: ${inserted}, total rows: ${await roomRepo.count()}, areas: ${areaCache.size}`);
}

function loadRecords(): {
  rooms: RawRoom[];
  areasFromSchedule: Map<string, { areaId?: string; areaName?: string }>;
  areaCatalog: { byId: Map<string, { code: string; name: string }>; byName: Map<string, { code: string; name: string }> };
} {
  const base = process.cwd();
  const refJson = join(base, 'reference-data/reference_data.json');
  const scheduleJson = join(base, 'reference-data/all_schedule.json');
  const scheduleCsv = join(base, 'reference-data/all_schedule.csv');

  const rooms: RawRoom[] = [];
  const areaByRoomId = new Map<string, { areaId?: string; areaName?: string }>();
  const areasById = new Map<string, { code: string; name: string }>();
  const areasByName = new Map<string, { code: string; name: string }>();

  if (existsSync(refJson)) {
    try {
      const parsed = JSON.parse(readFileSync(refJson, 'utf-8'));
      if (Array.isArray(parsed?.rooms)) {
        rooms.push(...(parsed.rooms as RawRoom[]));
      }
      if (Array.isArray(parsed?.areas)) {
        (parsed.areas as RawArea[]).forEach((a) => {
          if (!a.value || !a.text) return;
          areasById.set(String(a.value), { code: String(a.value), name: String(a.text) });
          areasByName.set(String(a.text).toLowerCase(), { code: String(a.value), name: String(a.text) });
        });
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

  // Map area info from schedule to each room_id
  for (const rec of scheduleRecords) {
    const rid = rec.room_id || rec.room || rec.room_name;
    if (!rid) continue;
    if (rec.area_name || rec.area_id) {
      areaByRoomId.set(rid, { areaId: rec.area_id ? String(rec.area_id) : undefined, areaName: rec.area_name });
    }
  }

  // Attach area info onto room records
  const roomsWithArea = rooms.map((room) => {
    const room_id = room.room_id || room.roomCode || room.code;
    const areaInfo = room_id ? areaByRoomId.get(room_id) : undefined;
    const area_name = areaInfo?.areaName || room.area_name;
    const area_id = areaInfo?.areaId;
    return { ...room, room_id, area_name, area_id };
  });

  return { rooms: roomsWithArea, areasFromSchedule: areaByRoomId, areaCatalog: { byId: areasById, byName: areasByName } };
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
