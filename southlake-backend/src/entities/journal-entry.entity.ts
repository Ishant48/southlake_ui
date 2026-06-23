import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Treaty } from './treaty.entity';
import { JournalEntryLine } from './journal-entry-line.entity';

@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  referenceNumber: string;

  @Column({ type: 'date' })
  entryDate: Date;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status: string; // Draft, Posted

  @Column({ type: 'varchar', length: 100, default: 'Manual' })
  source: string; // Manual, Treaty_Ingestion

  @Column({ type: 'uuid', nullable: true })
  treatyId: string;

  @ManyToOne(() => Treaty, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'treatyId' })
  treaty: Treaty;

  @OneToMany(() => JournalEntryLine, (line) => line.journalEntry, { cascade: true })
  lines: JournalEntryLine[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
