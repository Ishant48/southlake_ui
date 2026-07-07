import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { MastersGrid } from '../masters-grid/masters-grid';
import { LockPeriodModal } from '../lock-period-modal/lock-period-modal';
import { LockedPeriodsState } from '../../services/locked-periods-state';
import { SimpleMasterRecord } from '../../models/master.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { GridOptions, ColDef } from 'ag-grid-community';
import { downloadCsv } from '../../utils/csv-export.util';
import { buildLockedPeriodsColumnDefs } from '../../grid-columns/locked-periods-columns';

@Component({
  selector: 'app-locked-periods-tab',
  imports: [CommonModule, FormsModule, MastersGrid, LockPeriodModal],
  templateUrl: './locked-periods-tab.html',
})
export class LockedPeriodsTab implements OnInit {
  lockedPeriodsState = inject(LockedPeriodsState);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();
  loading = false;
  searchTerm = '';

  showLockPeriodModal = false;
  newPeriodToLock = '';
  submitting = false;

  ngOnInit(): void {
    this.load();
  }

  get currentList(): SimpleMasterRecord[] {
    return this.lockedPeriodsState.lockedPeriods;
  }

  get currentColumnDefs(): ColDef[] {
    return buildLockedPeriodsColumnDefs(this);
  }

  load(): void {
    this.loading = true;
    this.lockedPeriodsState.load(this.searchTerm || undefined).subscribe({
      next: () => {
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

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    downloadCsv([], [], '');
  }

  openLockPeriodAdd(): void {
    this.newPeriodToLock = '';
    this.showLockPeriodModal = true;
    this.cdr.detectChanges();
  }

  submitLockPeriod(period: string): void {
    this.newPeriodToLock = period;
    if (!this.newPeriodToLock) return;
    this.submitting = true;
    this.lockedPeriodsState.lock(this.newPeriodToLock).subscribe({
      next: () => {
        this.toast.success(`Successfully locked period "${this.newPeriodToLock}"`);
        this.showLockPeriodModal = false;
        this.newPeriodToLock = '';
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to lock period');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  togglePeriodLock(period: string, lock: boolean): void {
    const action = lock
      ? this.lockedPeriodsState.lock(period)
      : this.lockedPeriodsState.unlock(period);
    action.subscribe({
      next: () => {
        this.toast.success(`Successfully ${lock ? 'locked' : 'unlocked'} period "${period}"`);
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || `Failed to ${lock ? 'lock' : 'unlock'} period`);
      },
    });
  }
}
