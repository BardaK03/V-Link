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

  @Column({ nullable: true, type: 'text' })
  display_name: string | null;

  @Column({ nullable: true, type: 'text' })
  company_name: string | null;

  @Column({ nullable: true, type: 'text' })
  avatar_url: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
