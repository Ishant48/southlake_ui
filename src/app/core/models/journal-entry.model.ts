import { ChartOfAccount } from './chart-of-account.model';

export interface JournalEntryBatch {
  id: string;
  batch_number: string;
  period: string;
  agent_name: string;
  total_amount: number;
  count: number;
  created_at: string;
  updated_at?: string | null;
}

export interface JournalEntry {
  id: string;
  batch_id: string;
  je_number: number;
  description: string;
  coa_id: string;
  coa?: ChartOfAccount;
  sub?: string | null;
  debit?: number | null;
  credit?: number | null;
  date: string;
  dp?: string | null;
  policy?: string | null;
  memo?: string | null;
  created_at: string;
  updated_at?: string | null;
}
