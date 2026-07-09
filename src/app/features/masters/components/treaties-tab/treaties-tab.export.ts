import { Treaty, TreatyState, TreatyLob } from '../../models/master.model';
import { MastersExportData } from '../../services/masters-export-data';

export interface TreatyDisplayHelpers {
  getMgasListDisplay(treaty: Treaty): string;
  getStatesListDisplay(states?: TreatyState[]): string;
  getLobsListDisplay(lobs?: TreatyLob[]): string;
}

export function buildTreatiesExportData(
  treaties: Treaty[],
  display: TreatyDisplayHelpers,
): MastersExportData {
  return {
    headers: ['Code', 'Treaty Name', 'MGA', 'Carrier', 'States', 'LOBs (COBs)', 'Status'],
    rows: treaties.map(t => [
      t.treaty_code,
      t.name,
      display.getMgasListDisplay(t),
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      t.risk_company?.name || '-',
      display.getStatesListDisplay(t.treaty_states),
      display.getLobsListDisplay(t.treaty_lobs),
      t.is_active ? 'Active' : 'Inactive',
    ]),
    filename: 'treaties.csv',
  };
}
