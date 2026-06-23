import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Treaty } from './treaty.entity';
import { AppType } from './app-type.entity';

@Entity('treaty_app_types')
export class TreatyAppType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  treatyId: string;

  @ManyToOne(() => Treaty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treatyId' })
  treaty: Treaty;

  @Column({ type: 'int' })
  appTypeId: number;

  @ManyToOne(() => AppType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appTypeId' })
  appType: AppType;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.00 })
  cessionSharePercentage: number; // e.g. 100% of this app type's ceded risk goes here
}
