import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketplaceItem } from './marketplace-item.entity';

@Entity('user_equipped_cosmetics')
export class UserEquippedCosmetics {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ nullable: true, type: 'int' })
  name_color_item_id: number | null;

  @ManyToOne(() => MarketplaceItem, { nullable: true, eager: true })
  @JoinColumn({ name: 'name_color_item_id' })
  name_color_item: MarketplaceItem | null;

  @Column({ nullable: true, type: 'int' })
  name_animation_item_id: number | null;

  @ManyToOne(() => MarketplaceItem, { nullable: true, eager: true })
  @JoinColumn({ name: 'name_animation_item_id' })
  name_animation_item: MarketplaceItem | null;

  @Column({ nullable: true, type: 'int' })
  avatar_frame_item_id: number | null;

  @ManyToOne(() => MarketplaceItem, { nullable: true, eager: true })
  @JoinColumn({ name: 'avatar_frame_item_id' })
  avatar_frame_item: MarketplaceItem | null;

  @Column({ nullable: true, type: 'int' })
  glow_item_id: number | null;

  @ManyToOne(() => MarketplaceItem, { nullable: true, eager: true })
  @JoinColumn({ name: 'glow_item_id' })
  glow_item: MarketplaceItem | null;
}
