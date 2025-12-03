import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { Booking } from '../bookings/booking.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, (booking) => booking.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'booking_id' })
  bookingId!: string;

  @Column({ name: 'action', type: 'varchar' })
  action!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: User;

  @Column({ name: 'actor_user_id', type: 'uuid', nullable: true })
  actorUserId?: string;

  @Column({ name: 'actor_id', type: 'varchar' })
  actorId!: string;

  @Column({ name: 'actor_role', type: 'varchar' })
  actorRole!: string;

  @Column({ name: 'from_state', type: 'varchar', nullable: true })
  fromState?: string;

  @Column({ name: 'to_state', type: 'varchar', nullable: true })
  toState?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
