import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../events/entities/event.entity';

@Entity('event_roles')
export class EventRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @ManyToOne(() => Event, (event) => event.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  role_name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 1 })
  slots_needed: number;

  @Column({ default: 0 })
  hours_required: number;

  @Column({ default: 0 })
  points_reward: number;

  @Column({ type: 'int', array: true, nullable: true, default: [] })
  required_skills: number[];
}
