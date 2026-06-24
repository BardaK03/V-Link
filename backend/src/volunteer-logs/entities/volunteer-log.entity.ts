import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('volunteer_logs')
export class VolunteerLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  event_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  hours_worked: number;

  @Column({ default: 0 })
  points_earned: number;

  @CreateDateColumn({ type: 'timestamptz' })
  completed_at: Date;
}
