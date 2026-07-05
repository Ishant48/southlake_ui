import {
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';

@Component({
  selector: 'app-locked-periods',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './locked-periods.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockedPeriodsComponent implements OnInit {
  @Input() searchTerm = '';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  lockedPeriods: any[] = [];
  showLockPeriodModal = false;
  newPeriodToLock = '';
  loading = false;
  submitting = false;

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  columnDefs: ColDef[] = [
    { headerName: 'PERIOD', field: 'period', flex: 1.5, minWidth: 120 },
    {
      headerName: 'STATUS',
      valueGetter: (p: any) => (p.data.isLocked ? 'Locked' : 'Open'),
      cellRenderer: (p: any) => {
        const color = p.value === 'Locked' ? '#e05470' : '#19a347';
        return `<span style="font-weight: 700; color: ${color};">${p.value}</span>`;
      },
      flex: 1,
      minWidth: 100,
    },
    { headerName: 'LOCKED BY', valueGetter: (p: any) => p.data.user?.name || '-', flex: 1.5, minWidth: 120 },
    {
      headerName: 'LOCKED AT',
      valueGetter: (p: any) => (p.data.lockedAt ? new Date(p.data.lockedAt).toLocaleString() : '-'),
      flex: 2,
      minWidth: 150,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCellRenderer,
      cellRendererParams: {
        buttons: (data: any) => [
          {
            label: data.isLocked ? 'Unlock' : 'Lock',
            action: data.isLocked ? 'unlock' : 'lock',
          },
        ],
        onClick: (action: string, data: any) => {
          if (action === 'lock') this.togglePeriodLock(data.period, true);
          if (action === 'unlock') this.togglePeriodLock(data.period, false);
        },
      },
      flex: 0,
      width: 120,
      minWidth: 120,
      maxWidth: 120,
    },
  ];

  ngOnInit(): void {
    this.loadLockedPeriods();
  }

  load(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.loadLockedPeriods();
  }

  loadLockedPeriods(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const search = this.searchTerm || undefined;
    this.service.getLockedPeriods(search).subscribe({
      next: res => {
        this.lockedPeriods = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Locked Periods');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openLockPeriodAdd(): void {
    this.newPeriodToLock = '';
    this.showLockPeriodModal = true;
    this.cdr.markForCheck();
  }

  submitLockPeriod(): void {
    if (!this.newPeriodToLock) return;
    this.submitting = true;
    this.cdr.markForCheck();
    this.service.lockPeriod(this.newPeriodToLock).subscribe({
      next: () => {
        this.toast.success(`Successfully locked period "${this.newPeriodToLock}"`);
        this.showLockPeriodModal = false;
        this.newPeriodToLock = '';
        this.submitting = false;
        this.cdr.markForCheck();
        this.loadLockedPeriods();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to lock period');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  togglePeriodLock(period: string, lock: boolean): void {
    const action = lock ? this.service.lockPeriod(period) : this.service.unlockPeriod(period);
    action.subscribe({
      next: () => {
        this.toast.success(`Successfully ${lock ? 'locked' : 'unlocked'} period "${period}"`);
        this.loadLockedPeriods();
      },
      error: err => {
        this.toast.error(err.error?.message || `Failed to ${lock ? 'lock' : 'unlock'} period`);
      },
    });
  }
}
