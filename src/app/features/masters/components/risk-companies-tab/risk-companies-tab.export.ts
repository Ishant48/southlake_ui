import { RiskCompaniesState } from '../../services/risk-companies-state';
import { MastersExportData } from '../../services/masters-export-data';

export function buildRiskCompaniesExportData(state: RiskCompaniesState): MastersExportData {
  return {
    headers: [
      'Company',
      'ID Name',
      'Name',
      'Phone',
      'Admitted',
      'State',
      'Address 1',
      'Zip',
      'City',
      'Status',
    ],
    rows: state.riskCompanies.map(r => [
      r.company_id,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.id_name || '-',
      r.name,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.phone || '-',
      r.is_admitted ? 'Yes' : 'No',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.state || '-',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.address || '-',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.zip || '-',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      r.city || '-',
      r.is_active ? 'Active' : 'Inactive',
    ]),
    filename: 'risk_companies.csv',
  };
}
