import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { Booking } from '../bookings/booking.entity';

@Entity({ name: 'notification_outbox' })
export class NotificationOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, (booking) => booking.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'booking_id' })
  bookingId!: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ name: 'status', type: 'varchar', default: 'PENDING' })
  status!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
