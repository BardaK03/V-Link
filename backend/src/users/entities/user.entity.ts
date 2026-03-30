import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  VOLUNTEER = 'VOLUNTEER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  auth_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.VOLUNTEER })
  role: UserRole;

  @Column({ type: 'jsonb', default: {} })
  social_links: Record<string, string>;

  @Column({ type: 'int', default: 0 })
  total_points: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
