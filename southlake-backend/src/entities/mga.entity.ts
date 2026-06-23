import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('mgas')
export class Mga {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50, default: 'Active' })
  status: string; // e.g. Active, Inactive
}
