import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('organization_reviews')
@Unique(['reviewer_id', 'organization_id', 'event_id'])
export class OrganizationReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  reviewer_id: string;

  @Column('uuid')
  organization_id: string;

  @Column('uuid')
  event_id: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ nullable: true, type: 'text' })
  comment: string | null;

  @Column({ nullable: true, type: 'text' })
  photo_url: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: User;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
