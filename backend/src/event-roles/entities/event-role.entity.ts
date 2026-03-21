import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Event } from '../../events/entities/event.entity';

@Entity('event_roles')
export class EventRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  event_id: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  role_name: string;

  @Column({ default: 1 })
  slots_needed: number;

  @Column({ type: 'int', array: true, nullable: true })
  required_skills: number[];
}
