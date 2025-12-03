import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { User } from '../users/user.entity';
import { Room } from '../rooms/room.entity';

enum MaintenanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED'
}

@Entity({ name: 'maintenance_tickets' })
export class MaintenanceTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Room, { nullable: false })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @Column({ name: 'room_id' })
  roomId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reported_by_user_id' })
  reportedByUser?: User;

  @Column({ name: 'reported_by_user_id', nullable: true })
  reportedByUserId?: string;

  @Column({ name: 'title' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'status', type: 'varchar', default: MaintenanceStatus.OPEN })
  status!: MaintenanceStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolved_by_user_id' })
  resolvedByUser?: User;

  @Column({ name: 'resolved_by_user_id', nullable: true })
  resolvedByUserId?: string;

  @Column({ name: 'reported_by' })
  reportedBy!: string;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

export { MaintenanceStatus };
