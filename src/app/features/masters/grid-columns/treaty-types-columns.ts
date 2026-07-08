import { ColDef } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { TreatyTypeMaster } from '../models/master.model';
import { SimpleMode } from '../models/simple-form.model';

export function buildTreatyTypesColumnDefs(ctx: SimpleMasterTab, statusCol: ColDef): ColDef[] {
  return [
    {
      headerName: 'CODE ID',
      field: 'type_code',
      flex: 1.5,
      minWidth: 120,
      maxWidth: 180,
    },
    { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
    { headerName: 'DESCRIPTION', field: 'description', flex: 4, minWidth: 250 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'View Type', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: TreatyTypeMaster) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.TreatyType, data);
          if (action === 'view') ctx.openSimpleView(SimpleMode.TreatyType, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.TreatyType, data);
        },
      },
      flex: 0,
      width: 200,
      minWidth: 200,
      maxWidth: 200,
    },
  ];
}
