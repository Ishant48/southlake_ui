export interface TestBalanceRow {
  type: string;
  p_balance: number;
  c_balance: number;
  difference: number;
}

export interface TestBalanceAccount {
  code: string;
  name: string;
  type: string;
  status: string;
  bg_balance: number;
  current_balance: number;
  rows: TestBalanceRow[];
}

export interface TestBalanceResponse {
  month: string;
  year: number;
  status: string;
  accounts: TestBalanceAccount[];
}

export interface FinancialReportLineItem {
  accountCode: string;
  description: string;
  balance: number;
}

export interface BalanceSheetResponse {
  assets: FinancialReportLineItem[];
  liabilities: FinancialReportLineItem[];
  equity: FinancialReportLineItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface PLStatementResponse {
  revenues: FinancialReportLineItem[];
  expenses: FinancialReportLineItem[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
}
