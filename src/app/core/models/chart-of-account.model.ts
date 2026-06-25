export interface ChartOfAccountDocument {
  id: string;
  coa_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  uploaded_by?: string | null;
}

export interface ChartOfAccount {
  id: string;
  account_code: number;
  key?: string | null;
  description: string;
  parent_id?: string | null;
  parent?: ChartOfAccount | null;
  children?: ChartOfAccount[];
  is_parent: boolean;
  normal_balance?: string | null; // 'debit' | 'credit'
  next_number?: number | null;
  earning_account_id?: string | null;
  earning_account?: ChartOfAccount | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  documents?: ChartOfAccountDocument[];
}
