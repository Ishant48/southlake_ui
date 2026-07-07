import { ColDef } from 'ag-grid-community';
import type { MastersComponent } from '../masters.component';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { SimpleMasterRecord } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildBrokersColumnDefs(ctx: MastersComponent, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'BROKER CODE', field: 'brokerCode', flex: 1.5, minWidth: 120 },
    { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
    { headerName: 'CONTACT NAME', field: 'contactName', flex: 1.5, minWidth: 120 },
    { headerName: 'EMAIL', field: 'contactEmail', flex: 2, minWidth: 150 },
    { headerName: 'PHONE', field: 'contactPhone', flex: 1.5, minWidth: 120 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: SimpleMasterRecord) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Broker, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Broker, data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
