import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('app_types')
export class AppType {
  @PrimaryColumn({ type: 'int' })
  applicationTypeId: number;

  @Column({ type: 'varchar', length: 150 })
  applicationType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  classId: string;

  @Column({ type: 'int', default: 450 })
  marketCompanyId: number;

  @Column({ type: 'int', default: 101 })
  lobId: number;

  @Column({ type: 'int', default: 210 })
  riskCompanyId: number;

  @Column({ type: 'varchar', length: 50, default: 'Custom' })
  raterType: string;

  @Column({ type: 'varchar', length: 10, default: 'No' })
  appTypeMultiline: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  fees: string;

  @Column({ type: 'varchar', length: 10, default: 'Yes', nullable: true })
  forms: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  manager: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  underwriter: string;

  @Column({ type: 'varchar', length: 50, default: 'Commercial', nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 10, default: 'Yes', nullable: true })
  active: string;
}
