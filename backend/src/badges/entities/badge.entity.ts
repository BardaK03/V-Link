import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  action_trigger: string;
}
