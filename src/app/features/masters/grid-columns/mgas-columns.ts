import { ColDef } from 'ag-grid-community';
import type { MgasTab } from '../components/mgas-tab/mgas-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { MgaMaster } from '../models/master.model';
import { DocumentMode } from '../models/master-tab.model';

export function buildMgasColumnDefs(ctx: MgasTab, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'MGA CODE', field: 'mga_code', flex: 1, minWidth: 100, maxWidth: 120 },
    { headerName: 'MGA NAME', field: 'name', flex: 2, minWidth: 150 },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Treaty', action: 'addTreaty' },
          { label: 'Ledgers', action: 'ledgers' },
          { label: 'Invoices', action: 'invoices' },
          { label: 'Documents', action: 'doc' },
          { label: 'Users', action: 'users' },
          { label: 'Edit', action: 'edit' },
          { label: 'View MGA', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: MgaMaster) => {
          if (action === 'addTreaty') ctx.openTreatyAdd(data.id);
          if (action === 'doc') ctx.openDocModal(DocumentMode.Mga, data);
          if (action === 'users') ctx.openMgaUsers(data);
          if (action === 'edit') ctx.openMgaEdit(data);
          if (action === 'view') ctx.openMgaView(data);
          if (action === 'delete') ctx.deleteMga(data);
        },
      },
      flex: 0,
      width: 510,
      minWidth: 510,
      maxWidth: 510,
    },
  ];
}
