import { ColDef } from 'ag-grid-community';
import type { MgasTab } from '../components/mgas-tab/mgas-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { MgaMaster } from '../models/master.model';
import { DocumentMode } from '../models/master-tab.model';

export function buildMgasColumnDefs(ctx: MgasTab, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'MGA CODE', field: 'mga_code', flex: 1, minWidth: 100, maxWidth: 120 },
    { headerName: 'MGA NAME', field: 'name', flex: 2, minWidth: 150 },
    {
      headerName: 'TAX PAYABLE IN-HOUSE',
      field: 'tax_payable_inhouse',
      cellRenderer: StatusBadgeCell,
      flex: 1.5,
      minWidth: 150,
    },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Add Treaties', action: 'addTreaty' },
          { label: 'Document', action: 'doc' },
          { label: 'Edit', action: 'edit' },
          { label: 'View MGA', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: MgaMaster) => {
          if (action === 'addTreaty') ctx.openTreatyAdd(data.id);
          if (action === 'doc') ctx.openDocModal(DocumentMode.Mga, data);
          if (action === 'edit') ctx.openMgaEdit(data);
          if (action === 'view') ctx.openMgaView(data);
          if (action === 'delete') ctx.deleteMga(data);
        },
      },
      flex: 0,
      width: 320,
      minWidth: 320,
      maxWidth: 320,
    },
  ];
}
