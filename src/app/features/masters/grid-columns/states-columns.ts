import { ColDef } from 'ag-grid-community';
import type { StatesTab } from '../components/states-tab/states-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StateMaster } from '../models/master.model';
import { DocumentMode } from '../models/master-tab.model';

export function buildStatesColumnDefs(ctx: StatesTab): ColDef[] {
  return [
    { headerName: 'STATE CODE', field: 'state_code', flex: 1, minWidth: 100 },
    { headerName: 'STATE ABBR', field: 'state_abbr', flex: 1, minWidth: 100 },
    { headerName: 'STATE NAME', field: 'name', flex: 3, minWidth: 200 },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Document', action: 'doc' },
          { label: 'Notes', action: 'notes' },
          { label: 'View State', action: 'view' },
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: StateMaster) => {
          if (action === 'doc') ctx.openDocModal(DocumentMode.State, data);
          if (action === 'notes') ctx.openNotesModal('State Notes: ' + data.name, data.notes);
          if (action === 'view') ctx.openStateView(data);
          if (action === 'edit') ctx.openStateEdit(data);
          if (action === 'delete') ctx.deleteState(data);
        },
      },
      flex: 0,
      width: 320,
      minWidth: 320,
      maxWidth: 320,
    },
  ];
}
