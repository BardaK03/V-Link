import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MarketplaceItem } from './marketplace-item.entity';

@Entity('marketplace_purchases')
export class MarketplacePurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  item_id: number;

  @ManyToOne(() => MarketplaceItem)
  @JoinColumn({ name: 'item_id' })
  item: MarketplaceItem;

  @Column({ type: 'int' })
  point_cost: number;

  @Column({ default: 'COMPLETED' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  redemption_code: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
