import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Area } from '../areas/area.entity';

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @ManyToOne(() => Area, { eager: false, nullable: true })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @Column({ name: 'area_id', nullable: true })
  areaId?: string;

  @Column({ type: 'int', default: 0 })
  capacity!: number;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true })
  features?: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
