import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

export enum UserRole {
  STUDENT = 'student',
  LECTURER = 'lecturer',
  STAFF = 'staff',
  ADMIN = 'admin'
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nim!: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', default: UserRole.STUDENT })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
