import { ColDef } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { ReinsurerCompany } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildReinsurersColumnDefs(ctx: SimpleMasterTab, statusCol: ColDef): ColDef[] {
  return [
    {
      headerName: 'CODE ID',
      field: 'reinsurer_company_id',
      flex: 1.5,
      minWidth: 120,
      maxWidth: 180,
    },
    { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: ReinsurerCompany) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Reinsurer, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Reinsurer, data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
