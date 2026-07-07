import type { MastersComponent } from '../masters.component';
import { MasterTab } from '../models/master-tab.model';

export interface MastersExportData {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
}

export function buildMastersExportData(ctx: MastersComponent): MastersExportData {
  switch (ctx.currentTab) {
    case MasterTab.Treaties:
      return {
        headers: ['Code', 'Treaty Name', 'MGA', 'Risk Company', 'States', 'LOBs (COBs)', 'Status'],
        rows: ctx.treaties.map(t => [
          t.treaty_code,
          t.name,
          ctx.getMgasListDisplay(t),
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          t.risk_company?.name || '-',
          ctx.getStatesListDisplay(t.treaty_states),
          ctx.getLobsListDisplay(t.treaty_lobs),
          t.is_active ? 'Active' : 'Inactive',
        ]),
        filename: 'treaties.csv',
      };

    case MasterTab.Mgas:
      return {
        headers: ['MGA Code', 'MGA Name', 'Tax Payable In-house', 'Ledger Amount', 'Status'],
        rows: ctx.mgas.map(m => [
          m.mga_code,
          m.name,
          m.tax_payable_inhouse ? 'Yes' : 'No',
          m.ledger_amount !== undefined ? `$${m.ledger_amount.toFixed(2)}` : '$0.00',
          m.is_active ? 'Active' : 'Inactive',
        ]),
        filename: 'mgas.csv',
      };

    case MasterTab.States:
      return {
        headers: ['State Code', 'State Abbr', 'State Name', 'Status'],
        rows: ctx.statesState.states.map(s => [
          s.state_code,
          s.state_abbr,
          s.name,
          s.is_active ? 'Active' : 'Inactive',
        ]),
        filename: 'states.csv',
      };

    case MasterTab.RiskCompanies:
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
        rows: ctx.riskCompaniesState.riskCompanies.map(r => [
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

    case MasterTab.Lobs:
      return {
        headers: [
          'LOB Code',
          'LOB Name',
          'Taxable',
          'Priority',
          'Fully Earned',
          'Status',
          'Description',
        ],
        rows: ctx.simpleMastersState.lobs.map(l => [
          l.lob_code,
          l.name,
          l.taxable ? 'Yes' : 'No',
          l.priority,
          l.fully_earned ? 'Yes' : 'No',
          l.is_active ? 'Active' : 'Inactive',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          l.description || '-',
        ]),
        filename: 'lobs.csv',
      };

    case MasterTab.Cobs:
      return {
        headers: [
          'Class Code',
          'Class Name',
          'Class Type',
          'Taxable',
          'Priority',
          'Fully Earned',
          'Status',
          'Description',
        ],
        rows: ctx.simpleMastersState.cobs.map(c => [
          c.cob_code,
          c.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          c.type || '-',
          c.taxable ? 'Yes' : 'No',
          c.priority,
          c.fully_earned ? 'Yes' : 'No',
          c.is_active ? 'Active' : 'Inactive',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          c.description || '-',
        ]),
        filename: 'cobs.csv',
      };

    case MasterTab.Reinsurers:
      return {
        headers: ['Code ID', 'Name', 'Status'],
        rows: ctx.simpleMastersState.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive',
        ]),
        filename: 'reinsurers.csv',
      };

    case MasterTab.GlMappings:
      return {
        headers: ['GL Number', 'Type'],
        rows: ctx.glMappingsState.glMappings.map(m => [ctx.getGLNumberDisplay(m), m.type]),
        filename: 'gl_mappings.csv',
      };

    case MasterTab.DocumentTypes:
      return {
        headers: ['Code', 'Name', 'Description', 'Status'],
        rows: ctx.simpleMastersState.documentTypes.map(d => [
          d.code,
          d.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          d.description || '-',
          d.isActive ? 'Active' : 'Inactive',
        ]),
        filename: 'document_types.csv',
      };

    case MasterTab.SequencePrefixCounters:
      return {
        headers: ['Code', 'Name', 'Prefix', 'Next Value', 'Padding Width', 'Description', 'Status'],
        rows: ctx.simpleMastersState.sequencePrefixCounters.map(s => [
          s.code,
          s.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.prefix || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.next_value !== undefined ? s.next_value : s.nextValue || 1,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.padding_width !== undefined ? s.padding_width : s.paddingWidth || 4,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.description || '-',
          s.isActive ? 'Active' : 'Inactive',
        ]),
        filename: 'sequence_prefix_counters.csv',
      };

    default:
      return { headers: [], rows: [], filename: '' };
  }
}
