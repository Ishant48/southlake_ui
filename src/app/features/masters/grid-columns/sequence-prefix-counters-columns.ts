import { ColDef } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { SequencePrefixCounter } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildSequencePrefixCountersColumnDefs(
  ctx: SimpleMasterTab,
  statusCol: ColDef,
): ColDef[] {
  return [
    { headerName: 'CODE', field: 'code', flex: 1.5, minWidth: 120 },
    { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
    { headerName: 'PREFIX', field: 'prefix', flex: 1, minWidth: 100 },
    {
      headerName: 'NEXT VALUE',
      valueGetter: p => (p.data.next_value !== undefined ? p.data.next_value : p.data.nextValue),
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: 'PADDING WIDTH',
      valueGetter: p =>
        p.data.padding_width !== undefined ? p.data.padding_width : p.data.paddingWidth,
      flex: 1,
      minWidth: 100,
    },
    { headerName: 'DESCRIPTION', field: 'description', flex: 2.5, minWidth: 180 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'View Sequence Prefix Counter', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: SequencePrefixCounter) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.SequencePrefixCounter, data);
          if (action === 'view') ctx.openSimpleView(SimpleMode.SequencePrefixCounter, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.SequencePrefixCounter, data);
        },
      },
      flex: 0,
      width: 200,
      minWidth: 200,
      maxWidth: 200,
    },
  ];
}
