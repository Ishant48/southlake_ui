import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridOptions, ColDef } from 'ag-grid-community';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { ActiveStatusFilter } from '../../../../core/models/active-status-filter.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { MastersGrid } from '../masters-grid/masters-grid';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TreatyFormModal } from '../treaty-form-modal/treaty-form-modal';
import { TreatyUploadsPanel } from '../treaty-uploads-panel/treaty-uploads-panel';
import { TreatiesState } from '../../services/treaties-state';
import { TreatyOptionsState } from '../../services/treaty-options-state';
import { TreatyQuickAddState } from '../../services/treaty-quick-add-state';
import { Treaty, TreatyState, TreatyLob } from '../../models/master.model';
import { TreatySaveEvent } from '../../models/treaty-form.model';
import { buildTreatiesColumnDefs } from '../../grid-columns/treaties-columns';
import {
  buildBlankTreatyForm,
  buildTreatyEditState,
  buildTreatyPayload,
  TreatyEditState,
} from './treaty-selection.util';
import {
  getMgasListDisplay,
  getCarriersListDisplay,
  getStatesListDisplay,
  getLobsListDisplay,
} from './treaty-display.util';
import { buildTreatiesExportData } from './treaties-tab.export';
import { downloadCsv } from '../../utils/csv-export.util';
import {
  mgaLabelFn,
  riskCompanyLabelFn,
  reinsurerLabelFn,
  stateLabelFn,
  brokerLabelFn,
  lobLabelFn,
  cobLabelFn,
} from '../../utils/label-fns.util';

@Component({
  selector: 'app-treaties-tab',
  imports: [
    CommonModule,
    FormsModule,
    MastersGrid,
    TreatyFormModal,
    TreatyUploadsPanel,
    ConfirmDialogComponent,
  ],
  templateUrl: './treaties-tab.html',
})
export class TreatiesTab implements OnInit {
  treatiesState = inject(TreatiesState);
  treatyOptionsState = inject(TreatyOptionsState);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);
  private treatyQuickAddState = inject(TreatyQuickAddState);

  protected readonly mgaLabelFn = mgaLabelFn;
  protected readonly riskCompanyLabelFn = riskCompanyLabelFn;
  protected readonly reinsurerLabelFn = reinsurerLabelFn;
  protected readonly stateLabelFn = stateLabelFn;
  protected readonly brokerLabelFn = brokerLabelFn;
  protected readonly lobLabelFn = lobLabelFn;
  protected readonly cobLabelFn = cobLabelFn;

  @ViewChild(TreatyUploadsPanel) uploadsPanel!: TreatyUploadsPanel;

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();
  loading = false;
  searchTerm = '';
  statusFilter: ActiveStatusFilter = ActiveStatusFilter.All;
  mgaFilter = 'all';

  showTreatyModal = false;
  treatyModalTitle = '';
  isEditMode = false;
  submitting = false;
  treatyForm: TreatyEditState = buildBlankTreatyForm();

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.treatyOptionsState.loadMgaOptions().subscribe(() => this.cdr.markForCheck());
    this.load();

    const pendingMgaId = this.treatyQuickAddState.pendingMgaId;
    if (pendingMgaId) {
      this.treatyQuickAddState.pendingMgaId = null;
      this.openTreatyAdd(pendingMgaId);
    }
  }

  get activeFilterStatus(): boolean | undefined {
    if (this.statusFilter === ActiveStatusFilter.Active) return true;
    if (this.statusFilter === ActiveStatusFilter.Inactive) return false;
    return undefined;
  }

  get currentList(): Treaty[] {
    let list = this.treatiesState.treaties;
    if (this.mgaFilter && this.mgaFilter !== 'all') {
      list = list.filter(
        t => t.mga_id === this.mgaFilter || t.treaty_mgas?.some(tm => tm.mga_id === this.mgaFilter),
      );
    }
    return list;
  }

  get currentColumnDefs(): ColDef[] {
    return buildTreatiesColumnDefs(this);
  }

  load(): void {
    this.loading = true;
    this.treatiesState.load(this.searchTerm || undefined, this.activeFilterStatus).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load treaties');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildTreatiesExportData(this.treatiesState.treaties, this);
    downloadCsv(headers, rows, filename);
  }

  openTreatyAdd(mgaId?: string): void {
    this.isEditMode = false;
    this.treatyModalTitle = 'Create Treaty';
    this.treatyOptionsState.loadAll().subscribe(() => this.cdr.markForCheck());
    this.treatyForm = buildBlankTreatyForm(mgaId);
    this.showTreatyModal = true;
  }

  openTreatyEdit(treaty: Treaty): void {
    this.isEditMode = true;
    this.treatyModalTitle = `Edit Treaty: ${treaty.treaty_code}`;
    this.treatyOptionsState.loadAll().subscribe(() => this.cdr.markForCheck());
    this.treatyForm = buildTreatyEditState(treaty);
    this.showTreatyModal = true;
  }

  submitTreaty(event: TreatySaveEvent): void {
    this.treatyForm = {
      form: event.form,
      selectedStates: event.selectedStates,
      selectedLobs: event.selectedLobs,
      selectedCobs: event.selectedCobs,
    };

    if (!event.form.treaty_code || !event.form.name || !event.form.mga_id) {
      this.toast.error('Treaty Code, Name and MGA Underwriter are required');
      return;
    }
    this.submitting = true;

    const payload = buildTreatyPayload(
      event.form,
      event.selectedStates,
      event.selectedLobs,
      event.selectedCobs,
    );

    if (this.isEditMode && !event.form.id) return;
    this.treatiesState.save(this.isEditMode, event.form.id, payload).subscribe({
      next: () => {
        this.toast.success('Treaty saved successfully');
        this.showTreatyModal = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save treaty');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteTreaty(treaty: Treaty): void {
    this.confirmTitle = 'Delete Treaty';
    this.confirmMessage = `Are you sure you want to delete treaty "${treaty.treaty_code}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.treatiesState.delete(treaty.id).subscribe({
        next: () => {
          this.toast.success('Treaty deleted successfully');
          this.load();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty error message should also fall back to the default
          this.toast.error(err.error?.message || 'Failed to delete treaty');
        },
      });
    };
    this.confirmOpen = true;
  }

  getMgasListDisplay(treaty: Treaty): string {
    return getMgasListDisplay(treaty);
  }

  getCarriersListDisplay(treaty: Treaty): string {
    return getCarriersListDisplay(treaty);
  }

  getStatesListDisplay(states?: TreatyState[]): string {
    return getStatesListDisplay(states);
  }

  getLobsListDisplay(lobs?: TreatyLob[]): string {
    return getLobsListDisplay(lobs);
  }

  hasITDSeeded(programName: string): boolean {
    return this.treatiesState.hasITDSeeded(programName);
  }

  getTreatyStatus(programName?: string): string {
    return this.treatiesState.getTreatyStatus(programName);
  }

  triggerTreatyMonthlyUpload(treaty: Treaty): void {
    this.uploadsPanel.triggerMonthlyUpload(treaty);
  }

  triggerTreatyITDUpload(treaty: Treaty): void {
    this.uploadsPanel.triggerItdUpload(treaty);
  }

  openAddItdModal(treaty: Treaty): void {
    this.uploadsPanel.openAddItdModal(treaty);
  }

  onConfirm(): void {
    this.pendingAction?.();
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }
}
