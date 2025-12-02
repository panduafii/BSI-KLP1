import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AuditLog } from '../audit/audit-log.entity';
import { NotificationOutbox } from '../notifications/notification-outbox.entity';
import { Room } from '../rooms/room.entity';

import { Booking, BookingPriority, BookingStatus } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';

interface RequestContext {
  userId: string;
  userRole: string;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(NotificationOutbox)
    private readonly outboxRepo: Repository<NotificationOutbox>,
    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateBookingDto, ctx: RequestContext) {
    if (!ctx.userId || !ctx.userRole) {
      throw new BadRequestException('Missing user identity headers');
    }

    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (!(start < end)) {
      throw new BadRequestException('Invalid time range: start must be before end');
    }

    await this.precheckConflict(dto.roomId, start, end);
    await this.ensureRoomNotUnderMaintenance(dto.roomId);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const booking = manager.create(Booking, {
          roomId: dto.roomId,
          requesterId: ctx.userId,
          requesterRole: ctx.userRole,
          purpose: dto.purpose,
          priority: dto.priority ?? BookingPriority.NORMAL,
          startTime: start,
          endTime: end,
          status: BookingStatus.PENDING,
          conflictFlag: false
        });
        const saved = await manager.save(booking);

        const audit = manager.create(AuditLog, {
          bookingId: saved.id,
          action: 'BOOKING_SUBMITTED',
          actorId: ctx.userId,
          actorRole: ctx.userRole,
          fromState: undefined,
          toState: BookingStatus.PENDING
        });
        await manager.save(audit);

        const outbox = manager.create(NotificationOutbox, {
          bookingId: saved.id,
          eventType: 'BOOKING_SUBMITTED',
          payload: {
            bookingId: saved.id,
            status: saved.status,
            roomId: saved.roomId,
            startTime: saved.startTime,
            endTime: saved.endTime,
            requesterId: saved.requesterId,
            priority: saved.priority
          }
        });
        await manager.save(outbox);

        return saved;
      });
    } catch (err: any) {
      if (this.isExclusionConflict(err)) {
        throw new ConflictException('Booking conflict detected');
      }
      throw err;
    }
  }

  async findById(id: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ['auditLogs']
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async approve(id: string, ctx: RequestContext) {
    this.ensureAdmin(ctx);
    const booking = await this.findById(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException('Only pending bookings can be approved');
    }

    await this.ensureRoomNotUnderMaintenance(booking.roomId);
    await this.precheckConflict(booking.roomId, booking.startTime, booking.endTime, booking.id);

    return this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.APPROVED;
      booking.approvedBy = ctx.userId;
      booking.approvedAt = new Date();
      const saved = await manager.save(booking);

      await manager.save(
        manager.create(AuditLog, {
          bookingId: saved.id,
          action: 'BOOKING_APPROVED',
          actorId: ctx.userId,
          actorRole: ctx.userRole,
          fromState: BookingStatus.PENDING,
          toState: BookingStatus.APPROVED
        })
      );

      await manager.save(
        manager.create(NotificationOutbox, {
          bookingId: saved.id,
          eventType: 'BOOKING_APPROVED',
          payload: {
            bookingId: saved.id,
            status: saved.status,
            roomId: saved.roomId,
            startTime: saved.startTime,
            endTime: saved.endTime,
            actorId: ctx.userId
          }
        })
      );

      return saved;
    });
  }

  async reject(id: string, dto: RejectBookingDto, ctx: RequestContext) {
    this.ensureAdmin(ctx);
    const booking = await this.findById(id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new ConflictException('Only pending bookings can be rejected');
    }

    return this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.REJECTED;
      booking.rejectionReason = dto.reason;
      const saved = await manager.save(booking);

      await manager.save(
        manager.create(AuditLog, {
          bookingId: saved.id,
          action: 'BOOKING_REJECTED',
          actorId: ctx.userId,
          actorRole: ctx.userRole,
          fromState: BookingStatus.PENDING,
          toState: BookingStatus.REJECTED
        })
      );

      await manager.save(
        manager.create(NotificationOutbox, {
          bookingId: saved.id,
          eventType: 'BOOKING_REJECTED',
          payload: {
            bookingId: saved.id,
            status: saved.status,
            roomId: saved.roomId,
            startTime: saved.startTime,
            endTime: saved.endTime,
            actorId: ctx.userId,
            reason: dto.reason
          }
        })
      );

      return saved;
    });
  }

  async cancel(id: string, ctx: RequestContext) {
    const booking = await this.findById(id);
    const isAdmin = this.isAdmin(ctx);
    const isOwner = booking.requesterId === ctx.userId;
    if (!isAdmin && !isOwner) {
      throw new ConflictException('Only owner or admin can cancel booking');
    }
    if (![BookingStatus.PENDING, BookingStatus.APPROVED].includes(booking.status)) {
      throw new ConflictException('Only pending/approved bookings can be cancelled');
    }

    const previousStatus = booking.status;

    return this.dataSource.transaction(async (manager) => {
      booking.status = BookingStatus.CANCELLED;
      booking.cancelledBy = ctx.userId;
      booking.cancelledAt = new Date();
      const saved = await manager.save(booking);

      await manager.save(
        manager.create(AuditLog, {
          bookingId: saved.id,
          action: 'BOOKING_CANCELLED',
          actorId: ctx.userId,
          actorRole: ctx.userRole,
          fromState: previousStatus,
          toState: BookingStatus.CANCELLED
        })
      );

      await manager.save(
        manager.create(NotificationOutbox, {
          bookingId: saved.id,
          eventType: 'BOOKING_CANCELLED',
          payload: {
            bookingId: saved.id,
            status: saved.status,
            roomId: saved.roomId,
            actorId: ctx.userId
          }
        })
      );

      return saved;
    });
  }

  async list(filter: ListBookingsDto) {
    const qb = this.bookingRepo.createQueryBuilder('b');
    if (filter.status) {
      qb.andWhere('b.status = :status', { status: filter.status });
    }
    if (filter.roomId) {
      qb.andWhere('b.room_id = :roomId', { roomId: filter.roomId });
    }
    if (filter.from) {
      qb.andWhere('b.start_time >= :from', { from: filter.from });
    }
    if (filter.to) {
      qb.andWhere('b.end_time <= :to', { to: filter.to });
    }
    qb.orderBy('b.created_at', 'DESC');
    return qb.getMany();
  }

  async listByUser(userId: string) {
    return this.bookingRepo.find({
      where: { requesterId: userId },
      order: { createdAt: 'DESC' }
    });
  }

  private async precheckConflict(roomId: string, start: Date, end: Date, excludeId?: string) {
    const overlapCount = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.room_id = :roomId', { roomId })
      .andWhere('b.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.APPROVED]
      })
      .andWhere(excludeId ? 'b.id <> :excludeId' : '1=1', excludeId ? { excludeId } : {})
      .andWhere(`tstzrange(b.start_time, b.end_time) && tstzrange(:startTime, :endTime)`, {
        startTime: start,
        endTime: end
      })
      .getCount();

    if (overlapCount > 0) {
      throw new ConflictException('Booking conflict detected');
    }
  }

  private isExclusionConflict(err: any) {
    const message = err?.message || '';
    return message.includes('bookings_no_overlap') || message.includes('conflict');
  }

  private ensureAdmin(ctx: RequestContext) {
    if (!this.isAdmin(ctx)) {
      throw new ConflictException('Admin or staff role required');
    }
  }

  private isAdmin(ctx: RequestContext) {
    return ['admin', 'staff'].includes((ctx.userRole || '').toLowerCase());
  }

  private async ensureRoomNotUnderMaintenance(roomId: string) {
    const count = await this.dataSource
      .createQueryBuilder()
      .from('maintenance_tickets', 'm')
      .where('m.room_id = :roomId', { roomId })
      .andWhere("m.status IN ('OPEN','IN_PROGRESS')")
      .getCount();

    if (count > 0) {
      throw new ConflictException('Room is under maintenance');
    }
  }
}
