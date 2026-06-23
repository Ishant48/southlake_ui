import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('lobs')
export class Lob {
  @PrimaryColumn({ type: 'int' })
  lobId: number;

  @Column({ type: 'varchar', length: 150 })
  lobName: string;

  @Column({ type: 'text', nullable: true })
  description: string;
}
