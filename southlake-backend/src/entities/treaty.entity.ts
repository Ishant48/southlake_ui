import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Mga } from './mga.entity';

@Entity('treaties')
export class Treaty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // e.g. Quota Share, Excess of Loss

  @Column({ type: 'uuid', nullable: true })
  mgaId: string;

  @ManyToOne(() => Mga, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mgaId' })
  mga: Mga;

  @Column({ type: 'varchar', length: 150 })
  carrier: string; // e.g. Swiss Re, Munich Re

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  limit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  retentionPercentage: number; // e.g. 15.00 for 15%

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cessionPercentage: number; // e.g. 85.00 for 85%

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionPercentage: number; // e.g. 10.00 for 10%

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  cededPremiumYtd: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  recoverables: number;

  @Column({ type: 'varchar', length: 50, default: 'A' })
  rating: string; // e.g. AA-, A+

  @Column({ type: 'varchar', length: 150, default: 'Valid LOC' })
  collateral: string;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status: string; // e.g. Draft, Active, Run-off
}
