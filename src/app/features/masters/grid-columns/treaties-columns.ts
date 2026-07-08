import { ColDef } from 'ag-grid-community';
import type { TreatiesTab } from '../components/treaties-tab/treaties-tab';
import {
  ActionButtonConfig,
  ActionButtonsCell,
} from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { Treaty } from '../models/master.model';

export function buildTreatiesColumnDefs(ctx: TreatiesTab): ColDef[] {
  return [
    { headerName: 'CODE', field: 'treaty_code', flex: 1, minWidth: 100, maxWidth: 120 },
    { headerName: 'TREATY NAME', field: 'name', flex: 2, minWidth: 150 },
    {
      headerName: 'MGA',
      valueGetter: p => ctx.getMgasListDisplay(p.data),
      flex: 1.5,
      minWidth: 120,
    },
    {
      headerName: 'CARRIERS',
      valueGetter: p => ctx.getCarriersListDisplay(p.data),
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'STATES',
      valueGetter: p => ctx.getStatesListDisplay(p.data?.treaty_states),
      flex: 1.5,
      minWidth: 120,
    },
    {
      headerName: 'LOBS (COBS)',
      valueGetter: p => ctx.getLobsListDisplay(p.data?.treaty_lobs),
      flex: 2,
      minWidth: 150,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: (data: Treaty) => {
          const btns: ActionButtonConfig[] = [];
          if (ctx.hasITDSeeded(data.name)) {
            btns.push({ label: 'Upload Excel', action: 'uploadExcel' });
          }
          btns.push({ label: 'Upload ITD', action: 'uploadItd' });
          btns.push({ label: 'Manual ITD', action: 'manualItd' });
          btns.push({ label: 'View Treaty', action: 'view' });
          btns.push({ label: 'Edit', action: 'edit' });
          btns.push({ label: 'Delete', action: 'delete', danger: true });
          return btns;
        },
        onClick: (action: string, data: Treaty) => {
          if (action === 'uploadExcel') ctx.triggerTreatyMonthlyUpload(data);
          if (action === 'uploadItd') ctx.triggerTreatyITDUpload(data);
          if (action === 'manualItd') ctx.openAddItdModal(data);
          if (action === 'view') ctx.openTreatyView(data);
          if (action === 'edit') ctx.openTreatyEdit(data);
          if (action === 'delete') ctx.deleteTreaty(data);
        },
      },
      flex: 0,
      width: 220,
      minWidth: 220,
      maxWidth: 220,
      cellStyle: { justifyContent: 'flex-start' },
    },
  ];
}
