import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { EventRole } from '../../event-roles/entities/event-role.entity';
import { Application } from '../../applications/entities/application.entity';

@Entity('shift_assignments')
export class ShiftAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  application_id: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column('uuid')
  role_id: string;

  @ManyToOne(() => EventRole, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: EventRole;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  event_id: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'date' })
  shift_date: string;

  @Column({ type: 'time', default: '09:00' })
  start_time: string;

  @Column({ type: 'time', default: '17:00' })
  end_time: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  hours: number;

  @Column({ type: 'varchar', nullable: true })
  google_event_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
