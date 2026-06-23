import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('sub_coas')
export class SubCoa {
  @PrimaryColumn({ type: 'int' })
  categoryId: number;

  @Column({ type: 'varchar', length: 150 })
  categoryName: string;
}
