import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('gl_maps')
export class GlMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  glNumber: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;
}
