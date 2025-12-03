import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DataSource, Between } from 'typeorm';

import options from '../src/database/typeorm.config';
import { Booking, BookingStatus, BookingPriority } from '../src/modules/bookings/booking.entity';
import { Room } from '../src/modules/rooms/room.entity';

loadEnv();

const dataSource = new DataSource({
  ...(options as any),
  entities: [Booking, Room]
});

interface ScheduleRow {
  area_id?: string;
  area_name?: string;
  room_id?: string;
  room_name?: string;
  date?: string;
  time?: string;
  status?: string;
  detail?: string;
  [key: string]: any;
}

interface Slot {
  roomId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: string;
  detail?: string;
}

interface RoomMapEntry {
  roomId: string;
  dbId: string;
  code: string;
}

async function main() {
  const { slots, uniqueRooms } = loadSchedule();

  if (!slots.length) {
    console.log('No slots parsed from reference-data/all_schedule.*');
    return;
  }

  await dataSource.initialize();
  const bookingRepo = dataSource.getRepository(Booking);
  const roomRepo = dataSource.getRepository(Room);

  // Build map external room_id -> DB uuid
  const rooms = await roomRepo.find();
  const roomMap = buildRoomMap(rooms);

  const missing: Set<string> = new Set();
  let created = 0;
  let skipped = 0;

  for (const group of groupBookedSlots(slots)) {
    const roomEntry = roomMap.get(group.roomId);
    if (!roomEntry) {
      missing.add(group.roomId);
      continue;
    }

    const startISO = new Date(`${group.date}T${group.startTime}:00Z`);
    const endISO = new Date(`${group.date}T${group.endTime}:00Z`);
    const purpose = group.detail || 'Imported from reference-data schedule';

    // Check overlap with existing pending/approved bookings
    const overlap = await bookingRepo
      .createQueryBuilder('b')
      .where('b.room_id = :roomId', { roomId: roomEntry.dbId })
      .andWhere('b.status IN (:...statuses)', { statuses: [BookingStatus.PENDING, BookingStatus.APPROVED] })
      .andWhere('b.start_time < :endTime AND b.end_time > :startTime', { startTime: startISO, endTime: endISO })
      .getCount();

    if (overlap > 0) {
      skipped += 1;
      continue;
    }

    const booking = bookingRepo.create({
      roomId: roomEntry.dbId,
      purpose,
      priority: BookingPriority.NORMAL,
      startTime: startISO,
      endTime: endISO,
      status: BookingStatus.APPROVED,
      requesterId: 'system-seed',
      requesterRole: 'admin',
      approvedBy: 'system-seed',
      approvedAt: new Date()
    });

    await bookingRepo.save(booking);
    created += 1;
  }

  console.log(`Schedule import done. Created: ${created}, skipped(overlap): ${skipped}, missing rooms: ${missing.size}`);
  if (missing.size) {
    console.log('Missing external room_ids (need to ensure seed-rooms ran):', Array.from(missing).slice(0, 20));
  }
}

function loadSchedule(): { slots: Slot[]; uniqueRooms: Set<string> } {
  const base = process.cwd();
  const scheduleJson = join(base, 'reference-data/all_schedule.json');
  const scheduleCsv = join(base, 'reference-data/all_schedule.csv');

  const rows: ScheduleRow[] = [];
  if (existsSync(scheduleJson)) {
    try {
      const parsed = JSON.parse(readFileSync(scheduleJson, 'utf-8'));
      if (Array.isArray(parsed)) rows.push(...parsed);
    } catch (err) {
      console.warn('Failed to parse all_schedule.json:', err);
    }
  } else if (existsSync(scheduleCsv)) {
    const raw = readFileSync(scheduleCsv, 'utf-8');
    const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(',').map((h) => h.trim());
    rows.push(
      ...lines.map((line) => {
        const cols = line.split(',');
        const obj: ScheduleRow = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx];
        });
        return obj;
      })
    );
  }

  const slots: Slot[] = [];
  const uniqueRooms = new Set<string>();

  for (const row of rows) {
    if (!row.room_id || !row.date) continue;
    uniqueRooms.add(String(row.room_id));

    if (Array.isArray(row.schedule)) {
      for (const s of row.schedule as any[]) {
        if (!s?.time) continue;
        slots.push({
          roomId: String(row.room_id),
          date: row.date,
          time: s.time,
          status: s.status || '',
          detail: s.detail
        });
      }
      continue;
    }

    if (!row.time) continue;
    slots.push({
      roomId: String(row.room_id),
      date: row.date,
      time: row.time,
      status: row.status || '',
      detail: row.detail
    });
  }

  // Sort by room/date/time
  slots.sort((a, b) => {
    if (a.roomId !== b.roomId) return a.roomId.localeCompare(b.roomId);
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  if (process.env.DEBUG_SCHEDULE === '1') {
    console.log(`[DEBUG] Loaded rows: ${rows.length}, slots kept: ${slots.length}, unique rooms: ${uniqueRooms.size}`);
  }

  return { slots, uniqueRooms };
}

function groupBookedSlots(slots: Slot[]) {
  const groups: Array<{
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    detail?: string;
  }> = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.status.toLowerCase() !== 'booked') continue;

    const start = slot.time;
    let end = addMinutes(slot.time, 30);
    let detail = slot.detail;

    while (
      i + 1 < slots.length &&
      slots[i + 1].roomId === slot.roomId &&
      slots[i + 1].date === slot.date &&
      slots[i + 1].status.toLowerCase() === 'booked' &&
      slots[i + 1].time === end
    ) {
      i += 1;
      end = addMinutes(slots[i].time, 30);
      if (!detail) detail = slots[i].detail;
    }

    groups.push({
      roomId: slot.roomId,
      date: slot.date,
      startTime: start,
      endTime: end,
      detail
    });
  }

  return groups;
}

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  const date = new Date(Date.UTC(1970, 0, 1, h, m + minutes, 0));
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function buildRoomMap(rooms: Room[]) {
  const map = new Map<string, RoomMapEntry>();
  for (const room of rooms) {
    const externalId = (room.features as any)?.externalRoomId;
    if (externalId) {
      map.set(String(externalId), { roomId: String(externalId), dbId: room.id, code: room.code });
    }
  }
  return map;
}

main()
  .then(() => {
    if (dataSource.isInitialized) return dataSource.destroy();
  })
  .catch((err) => {
    console.error(err);
    if (dataSource.isInitialized) dataSource.destroy();
    process.exit(1);
  });
