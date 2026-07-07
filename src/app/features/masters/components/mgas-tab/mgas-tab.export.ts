import { MgasState } from '../../services/mgas-state';
import { MastersExportData } from '../../services/masters-export-data';

export function buildMgasExportData(state: MgasState): MastersExportData {
  return {
    headers: ['MGA Code', 'MGA Name', 'Tax Payable In-house', 'Ledger Amount', 'Status'],
    rows: state.mgas.map(m => [
      m.mga_code,
      m.name,
      m.tax_payable_inhouse ? 'Yes' : 'No',
      m.ledger_amount !== undefined ? `$${m.ledger_amount.toFixed(2)}` : '$0.00',
      m.is_active ? 'Active' : 'Inactive',
    ]),
    filename: 'mgas.csv',
  };
}
