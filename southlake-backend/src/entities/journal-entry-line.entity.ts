import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { JournalEntry } from './journal-entry.entity';
import { CoaAccount } from './coa-account.entity';

@Entity('journal_entry_lines')
export class JournalEntryLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  journalEntryId: string;

  @ManyToOne(() => JournalEntry, (je) => je.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry: JournalEntry;

  @Column({ type: 'uuid' })
  coaAccountId: string;

  @ManyToOne(() => CoaAccount)
  @JoinColumn({ name: 'coaAccountId' })
  coaAccount: CoaAccount;

  @Column({ type: 'varchar', length: 250, nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'integer', default: 0 })
  quantity: number;
}
