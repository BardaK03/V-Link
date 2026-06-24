import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EventRole } from '../../event-roles/entities/event-role.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  organizer_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizer_id' })
  organizer: User;

  @OneToMany(() => EventRole, (role) => role.event, { cascade: false })
  roles: EventRole[];

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  address: string;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  @Column({ type: 'text', default: 'ACTIVE' })
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @Column({ type: 'timestamptz', nullable: true })
  registration_deadline: Date | null;

  @Column({ type: 'text', default: 'OPEN' })
  registration_status: 'OPEN' | 'CLOSED';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
