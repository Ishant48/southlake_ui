import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Mga } from './mga.entity';
import { Lob } from './lob.entity';
import { State } from './state.entity';

@Entity('coa_accounts')
export class CoaAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: '100' })
  company: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  accountNumber: string;

  @Column({ type: 'varchar', length: 150 })
  accountName: string;

  @Column({ type: 'varchar', length: 50 })
  accountType: string; // e.g. Asset, Liability, Revenue, Expense, Equity

  @Column({ type: 'varchar', length: 50, default: '-' })
  costCenter: string;

  @Column({ type: 'uuid', nullable: true })
  mgaId: string;

  @ManyToOne(() => Mga, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mgaId' })
  mga: Mga;

  @Column({ type: 'int', nullable: true })
  lobId?: number;

  @ManyToOne(() => Lob, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lobId' })
  lob?: Lob;

  @Column({ type: 'uuid', nullable: true })
  stateId: string;

  @ManyToOne(() => State, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stateId' })
  state: State;

  @Column({ type: 'varchar', length: 50, default: '-' })
  extension: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string; // e.g. Active, Inactive

  @Column({ type: 'varchar', length: 50, default: 'GAAP' })
  gaapStandard: string; // e.g. GAAP, IFRS, STAT, SAP

  @Column({ type: 'varchar', length: 50, nullable: true })
  parentAccount: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  accountGroup: string;

  @Column({ type: 'varchar', length: 50, default: 'Actual Account', nullable: true })
  summaryOrActual: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  earningAccount: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
