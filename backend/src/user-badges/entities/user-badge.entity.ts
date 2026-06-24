import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Badge } from '../../badges/entities/badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryColumn('uuid')
  user_id: string;

  @PrimaryColumn()
  badge_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Badge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  awarded_at: Date;
}
