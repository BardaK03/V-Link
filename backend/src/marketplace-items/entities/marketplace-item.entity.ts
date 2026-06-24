import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('marketplace_items')
export class MarketplaceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  point_cost: number;

  @Column({ nullable: true })
  description: string;
}
