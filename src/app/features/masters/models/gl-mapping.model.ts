import { ChartOfAccount } from '../../../core/models/chart-of-account.model';

export interface GlMapping {
  id: string;
  coa_id: string;
  type: string; // 'AR' | 'AP' | 'MGA' | 'BRK'
  coa?: ChartOfAccount;
  created_at?: string;
  updated_at?: string | null;
}
