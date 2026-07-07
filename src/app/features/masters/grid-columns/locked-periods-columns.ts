import { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { MastersComponent } from '../masters.component';
import { ActionButtonsCell } from '../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { LockedPeriod } from '../models/locked-period.model';

export function buildLockedPeriodsColumnDefs(ctx: MastersComponent): ColDef[] {
  return [
    { headerName: 'PERIOD', field: 'period', flex: 1.5, minWidth: 120 },
    {
      headerName: 'STATUS',
      valueGetter: p => (p.data.isLocked ? 'Locked' : 'Open'),
      cellRenderer: (p: ICellRendererParams<LockedPeriod, string>) => {
        const color = p.value === 'Locked' ? '#e05470' : '#19a347';
        return `<span style="font-weight: 700; color: ${color};">${p.value}</span>`;
      },
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: 'LOCKED BY',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
      valueGetter: p => p.data.user?.name || '-',
      flex: 1.5,
      minWidth: 120,
    },
    {
      headerName: 'LOCKED AT',
      valueGetter: p => (p.data.lockedAt ? new Date(p.data.lockedAt).toLocaleString() : '-'),
      flex: 2,
      minWidth: 150,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCell,
      cellRendererParams: {
        buttons: (data: LockedPeriod) => [
          {
            label: data.isLocked ? 'Unlock' : 'Lock',
            action: data.isLocked ? 'unlock' : 'lock',
          },
        ],
        onClick: (action: string, data: LockedPeriod) => {
          if (action === 'lock') ctx.togglePeriodLock(data.period, true);
          if (action === 'unlock') ctx.togglePeriodLock(data.period, false);
        },
      },
      flex: 0,
      width: 120,
      minWidth: 120,
      maxWidth: 120,
    },
  ];
}
