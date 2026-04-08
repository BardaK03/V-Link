import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type ItemCategory =
  | 'COSMETIC_NAME_COLOR'
  | 'COSMETIC_NAME_ANIMATION'
  | 'COSMETIC_AVATAR_FRAME'
  | 'COSMETIC_GLOW'
  | 'PERK';

@Entity('marketplace_items')
export class MarketplaceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'int' })
  point_cost: number;

  @Column({ type: 'text' })
  category: ItemCategory;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true, type: 'int' })
  stock: number | null;
}
