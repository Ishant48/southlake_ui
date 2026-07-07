import { ColDef } from 'ag-grid-community';
import type { MastersComponent } from '../masters.component';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { RiskCompany } from '../models/master.model';
import { DocumentMode } from '../models/master-tab.model';

export function buildRiskCompaniesColumnDefs(ctx: MastersComponent): ColDef[] {
  return [
    {
      headerName: 'COMPANY',
      valueGetter: p =>
        `${p.data.company_id}${p.data.risk_company_id ? ` (${p.data.risk_company_id})` : ''}`,
      flex: 1.5,
      minWidth: 150,
    },
    { headerName: 'ID NAME', field: 'id_name', flex: 1.5, minWidth: 150 },
    { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
    { headerName: 'PHONE', field: 'phone', flex: 1.5, minWidth: 120 },
    {
      headerName: 'ADMITTED',
      field: 'is_admitted',
      cellRenderer: StatusBadgeCell,
      flex: 1,
      minWidth: 100,
    },
    { headerName: 'STATE', field: 'state', flex: 1, minWidth: 80 },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Document', action: 'doc' },
          { label: 'Notes', action: 'notes' },
          { label: 'View Policy', action: 'policy' },
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: RiskCompany) => {
          if (action === 'doc') ctx.openDocModal(DocumentMode.RiskCompany, data);
          if (action === 'notes')
            ctx.openNotesModal('Risk Company Notes: ' + data.name, data.notes);
          if (action === 'policy') ctx.viewPolicy(data);
          if (action === 'edit') ctx.openRiskCompanyEdit(data);
          if (action === 'delete') ctx.deleteRiskCompany(data);
        },
      },
      flex: 0,
      width: 360,
      minWidth: 360,
      maxWidth: 360,
    },
  ];
}
