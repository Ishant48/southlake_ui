import { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { SimpleMasterTab } from '../components/simple-master-tab/simple-master-tab';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { CobMaster } from '../models/master.model';
import { SimpleMode } from '../components/simple-form-modal/simple-form-modal';

export function buildCobsColumnDefs(ctx: SimpleMasterTab, statusCol: ColDef): ColDef[] {
  return [
    { headerName: 'CLASS CODE', field: 'cob_code', flex: 1, minWidth: 100, maxWidth: 120 },
    {
      headerName: 'CLASS NAME',
      valueGetter: p => p.data.name,
      cellRenderer: (p: ICellRendererParams<CobMaster>) => {
        const desc = p.data?.description
          ? `<div style="font-size: 11px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${p.data.description}">${p.data.description}</div>`
          : '';
        return `<div style="line-height:1.2; margin-top:10px;"><div style="font-weight: 500;">${p.data?.name}</div>${desc}</div>`;
      },
      flex: 3,
      minWidth: 200,
    },
    { headerName: 'CLASS TYPE', field: 'type', flex: 1.5, minWidth: 120 },
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
          { label: 'View Class of Business', action: 'view' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: CobMaster) => {
          if (action === 'edit') ctx.openSimpleEdit(SimpleMode.Cob, data);
          if (action === 'view') ctx.openSimpleView(SimpleMode.Cob, data);
          if (action === 'delete') ctx.deleteSimple(SimpleMode.Cob, data);
        },
      },
      flex: 0,
      width: 200,
      minWidth: 200,
      maxWidth: 200,
    },
  ];
}
