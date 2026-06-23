import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('states')
export class State {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 2, unique: true })
  code: string;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  premiumTax: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  surplusTax: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 0 })
  stampingFee: number;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status: string; // e.g. Active, Configured, Draft
}
