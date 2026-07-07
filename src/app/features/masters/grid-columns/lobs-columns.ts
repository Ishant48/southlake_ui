import { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { MastersComponent } from '../masters.component';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { LineOfBusiness } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildLobsColumnDefs(ctx: MastersComponent, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'LOB CODE', field: 'lob_code', flex: 1, minWidth: 100, maxWidth: 120 },
    {
      headerName: 'LOB NAME',
      valueGetter: p => p.data.name,
      cellRenderer: (p: ICellRendererParams<LineOfBusiness>) => {
        const desc = p.data?.description
          ? `<div style="font-size: 11px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${p.data.description}">${p.data.description}</div>`
          : '';
        return `<div style="line-height:1.2; margin-top:10px;"><div style="font-weight: 500;">${p.data?.name}</div>${desc}</div>`;
      },
      flex: 3,
      minWidth: 200,
    },
    {
      headerName: 'TAXABLE',
      field: 'taxable',
      cellRenderer: StatusBadgeCell,
      flex: 1,
      minWidth: 100,
    },
    { headerName: 'PRIORITY', field: 'priority', flex: 1, minWidth: 100 },
    {
      headerName: 'FULLY EARNED',
      field: 'fully_earned',
      cellRenderer: StatusBadgeCell,
      flex: 1,
      minWidth: 120,
    },
    statusCol,
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: LineOfBusiness) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Lob, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Lob, data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];
}
