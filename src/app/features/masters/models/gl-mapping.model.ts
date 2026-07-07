import { ChartOfAccount } from '../../../core/models/chart-of-account.model';

export enum GlMappingType {
  Ar = 'AR',
  Ap = 'AP',
  Mga = 'MGA',
  Brk = 'BRK',
}

export interface GlMapping {
  id: string;
  coa_id: string;
  type: string;
  coa?: ChartOfAccount;
  created_at?: string;
  updated_at?: string | null;
}
