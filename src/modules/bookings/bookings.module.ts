import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLog } from '../audit/audit-log.entity';
import { NotificationOutbox } from '../notifications/notification-outbox.entity';
import { Room } from '../rooms/room.entity';

import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Room, AuditLog, NotificationOutbox])],
  controllers: [BookingsController],
  providers: [BookingsService]
})
export class BookingsModule {}
