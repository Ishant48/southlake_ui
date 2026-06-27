import { ChartOfAccount } from './chart-of-account.model';

export interface JournalEntryBatch {
  id: string;
  batchNumber: string;
  period: string;
  agentName: string;
  totalAmount: number;
  count: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface JournalEntry {
  id: string;
  batchId: string;
  jeNumber: number;
  description: string;
  coaId: string;
  coa?: ChartOfAccount;
  sub?: string | null;
  debit?: number | null;
  credit?: number | null;
  date: string;
  dp?: string | null;
  policy?: string | null;
  memo?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
