import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('chart_of_accounts')
export class ChartOfAccount {
  @Column({ type: 'int' })
  parentCoaId: number;

  @PrimaryColumn({ type: 'int' })
  subCoaId: number;

  @Column({ type: 'varchar', length: 150 })
  subCoaName: string;

  @Column({ type: 'varchar', length: 100 })
  subCoaKey: string;

  @Column({ type: 'int' })
  nextAvailableNumber: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number;
}
