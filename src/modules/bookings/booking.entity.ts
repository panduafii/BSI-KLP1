import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { AuditLog } from '../audit/audit-log.entity';
import { NotificationOutbox } from '../notifications/notification-outbox.entity';
import { Room } from '../rooms/room.entity';

enum BookingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

enum BookingPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH'
}

@Entity({ name: 'bookings' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Room, { eager: false, nullable: false })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @Column({ name: 'room_id' })
  roomId!: string;

  @Column({ name: 'requester_id' })
  requesterId!: string;

  @Column({ name: 'requester_role' })
  requesterRole!: string;

  @Column({ name: 'purpose', type: 'text' })
  purpose!: string;

  @Column({ name: 'priority', type: 'varchar', default: BookingPriority.NORMAL })
  priority!: BookingPriority;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({ name: 'status', type: 'varchar', default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy?: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'conflict_flag', type: 'boolean', default: false })
  conflictFlag!: boolean;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => AuditLog, (log) => log.booking, { cascade: false })
  auditLogs?: AuditLog[];

  @OneToMany(() => NotificationOutbox, (outbox) => outbox.booking, { cascade: false })
  notifications?: NotificationOutbox[];
}

export { BookingStatus, BookingPriority };
