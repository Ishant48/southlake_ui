import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('treaty_sequences')
export class TreatySequence {
  @PrimaryColumn({ type: 'int' })
  sequenceNumber: number;

  @Column({ type: 'varchar', length: 100 })
  description: string;
}
