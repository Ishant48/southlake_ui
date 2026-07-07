import { SimpleMastersState } from '../../services/simple-masters-state';
import { SimpleMode } from '../../models/simple-form.model';
import { MastersExportData } from '../../services/masters-export-data';

export function buildSimpleTabExportData(
  mode: SimpleMode,
  state: SimpleMastersState,
): MastersExportData {
  switch (mode) {
    case SimpleMode.Lob:
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
        rows: state.lobs.map(l => [
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

    case SimpleMode.Cob:
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
        rows: state.cobs.map(c => [
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

    case SimpleMode.Reinsurer:
      return {
        headers: ['Code ID', 'Name', 'Status'],
        rows: state.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive',
        ]),
        filename: 'reinsurers.csv',
      };

    case SimpleMode.DocumentType:
      return {
        headers: ['Code', 'Name', 'Description', 'Status'],
        rows: state.documentTypes.map(d => [
          d.code,
          d.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          d.description || '-',
          d.isActive ? 'Active' : 'Inactive',
        ]),
        filename: 'document_types.csv',
      };

    case SimpleMode.SequencePrefixCounter:
      return {
        headers: ['Code', 'Name', 'Prefix', 'Next Value', 'Padding Width', 'Description', 'Status'],
        rows: state.sequencePrefixCounters.map(s => [
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
