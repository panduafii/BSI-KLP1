import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

import { AuditLog } from '../modules/audit/audit-log.entity';
import { Booking } from '../modules/bookings/booking.entity';
import { MaintenanceTicket } from '../modules/maintenance/maintenance-ticket.entity';
import { NotificationOutbox } from '../modules/notifications/notification-outbox.entity';
import { Room } from '../modules/rooms/room.entity';
import { User } from '../modules/users/user.entity';

loadEnv();

const isTsNode = process.env.TS_NODE === 'true' || process.env.NODE_ENV === 'development';
const migrationsPath = isTsNode ? 'src/database/migrations/*.ts' : 'dist/database/migrations/*.js';

const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Room, Booking, AuditLog, NotificationOutbox, MaintenanceTicket, User],
  migrations: [migrationsPath],
  synchronize: false,
  logging: false
};

export const AppDataSource = new DataSource(options);

export default options;
