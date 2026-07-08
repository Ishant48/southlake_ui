import { ColDef } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { SimpleMasterRecord } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildBrokersColumnDefs(ctx: SimpleMasterTab, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'BROKER CODE', field: 'broker_code', flex: 1.5, minWidth: 120 },
    { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
    { headerName: 'CONTACT NAME', field: 'contact_name', flex: 1.5, minWidth: 120 },
    { headerName: 'EMAIL', field: 'contact_email', flex: 2, minWidth: 150 },
    { headerName: 'PHONE', field: 'contact_phone', flex: 1.5, minWidth: 120 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'View Broker', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: SimpleMasterRecord) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Broker, data);
          if (action === 'view') ctx.openSimpleView(SimpleMode.Broker, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Broker, data);
        },
      },
      flex: 0,
      width: 200,
      minWidth: 200,
      maxWidth: 200,
    },
  ];
}
