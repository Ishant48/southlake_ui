import { Component, Input, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { ActiveStatusFilter } from '../../../../core/models/active-status-filter.model';
import { MastersGrid } from '../masters-grid/masters-grid';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SimpleFormModal } from '../simple-form-modal/simple-form-modal';
import { SimpleMastersState } from '../../services/simple-masters-state';
import { SimpleMode, SimpleFormValue, createBlankSimpleForm } from '../../models/simple-form.model';
import { SimpleEditableItem } from '../../models/master-tab.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { GridOptions, ColDef } from 'ag-grid-community';
import { lobLabelFn, cobLabelFn, nameLabelFn } from '../../utils/label-fns.util';
import { downloadCsv } from '../../utils/csv-export.util';
import { buildSimpleTabExportData } from './simple-master-tab.export';
import { buildLobsColumnDefs } from '../../grid-columns/lobs-columns';
import { buildCobsColumnDefs } from '../../grid-columns/cobs-columns';
import { buildReinsurersColumnDefs } from '../../grid-columns/reinsurers-columns';
import { buildBrokersColumnDefs } from '../../grid-columns/brokers-columns';
import { buildProductsColumnDefs } from '../../grid-columns/products-columns';
import { buildDocumentTypesColumnDefs } from '../../grid-columns/document-types-columns';
import { buildSequencePrefixCountersColumnDefs } from '../../grid-columns/sequence-prefix-counters-columns';
import { StatusBadgeCell } from '../../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';

const ADD_LABELS: Record<SimpleMode, string> = {
  [SimpleMode.Lob]: 'LOB',
  [SimpleMode.Cob]: 'COB',
  [SimpleMode.Reinsurer]: 'Reinsurer',
  [SimpleMode.Broker]: 'Broker',
  [SimpleMode.Product]: 'Product',
  [SimpleMode.DocumentType]: 'Document Type',
  [SimpleMode.SequencePrefixCounter]: 'Sequence Counter',
};

const SIMPLE_TYPE_OPTIONS = [
  { id: 'Fee', name: 'Fee' },
  { id: 'Premium', name: 'Premium' },
];

@Component({
  selector: 'app-simple-master-tab',
  imports: [CommonModule, FormsModule, MastersGrid, SimpleFormModal, ConfirmDialogComponent],
  templateUrl: './simple-master-tab.html',
})
export class SimpleMasterTab implements OnInit {
  @Input({ required: true }) mode!: SimpleMode;

  protected readonly SimpleMode = SimpleMode;
  protected readonly lobLabelFn = lobLabelFn;
  protected readonly cobLabelFn = cobLabelFn;
  protected readonly nameLabelFn = nameLabelFn;
  protected readonly simpleFormTypeOptions = SIMPLE_TYPE_OPTIONS;

  simpleMastersState = inject(SimpleMastersState);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();
  loading = false;
  searchTerm = '';
  statusFilter: ActiveStatusFilter = ActiveStatusFilter.All;

  showModal = false;
  modalTitle = '';
  isEditMode = false;
  isViewMode = false;
  submitting = false;
  form: SimpleFormValue = createBlankSimpleForm();

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.load();
    if (this.mode === SimpleMode.Product) {
      this.simpleMastersState.load(SimpleMode.Lob, undefined, true).subscribe();
      this.simpleMastersState.load(SimpleMode.Cob, undefined, true).subscribe();
    }
  }

  get addLabel(): string {
    return ADD_LABELS[this.mode];
  }

  get activeFilterStatus(): boolean | undefined {
    if (this.statusFilter === ActiveStatusFilter.Active) return true;
    if (this.statusFilter === ActiveStatusFilter.Inactive) return false;
    return undefined;
  }

  get currentList(): SimpleEditableItem[] {
    return this.simpleMastersState.getList(this.mode);
  }

  get currentColumnDefs(): ColDef[] {
    const statusCol: ColDef = {
      headerName: 'STATUS',
      field: 'is_active',
      flex: 1,
      minWidth: 100,
      maxWidth: 120,
      cellRenderer: StatusBadgeCell,
    };
    switch (this.mode) {
      case SimpleMode.Lob:
        return buildLobsColumnDefs(this, statusCol);
      case SimpleMode.Cob:
        return buildCobsColumnDefs(this, statusCol);
      case SimpleMode.Reinsurer:
        return buildReinsurersColumnDefs(this, statusCol);
      case SimpleMode.Broker:
        return buildBrokersColumnDefs(this, statusCol);
      case SimpleMode.Product:
        return buildProductsColumnDefs(this, statusCol);
      case SimpleMode.DocumentType:
        return buildDocumentTypesColumnDefs(this, statusCol);
      case SimpleMode.SequencePrefixCounter:
        return buildSequencePrefixCountersColumnDefs(this, statusCol);
    }
  }

  load(): void {
    this.loading = true;
    this.simpleMastersState
      .load(this.mode, this.searchTerm || undefined, this.activeFilterStatus)
      .subscribe({
        next: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.toast.error(`Failed to load ${this.simpleMastersState.getMasterLabel(this.mode)}s`);
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildSimpleTabExportData(
      this.mode,
      this.simpleMastersState,
    );
    downloadCsv(headers, rows, filename);
  }

  openSimpleAdd(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.modalTitle = `Add New ${this.simpleMastersState.getMasterLabel(this.mode)}`;
    this.form = createBlankSimpleForm();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openSimpleEdit(mode: SimpleMode, item: SimpleEditableItem): void {
    this.isEditMode = true;
    this.isViewMode = false;
    this.modalTitle = `Edit ${this.simpleMastersState.getMasterLabel(mode)}`;
    const rec = item as unknown as Record<string, unknown>;
    this.form = {
      id: item.id,
      code: (rec['code'] ??
        rec['lob_code'] ??
        rec['cob_code'] ??
        rec['reinsurer_company_id'] ??
        rec['product_id']) as string,
      name: item.name ?? '',
      is_active: item.is_active ?? false,
      description: (rec['description'] as string) ?? '',
      type: (rec['type'] as string) ?? '',
      taxable: (rec['taxable'] as boolean) ?? false,
      priority: (rec['priority'] as number) ?? 1,
      fully_earned: (rec['fully_earned'] as boolean) ?? false,
      contact_name: (rec['contactName'] as string) ?? '',
      contact_email: (rec['contactEmail'] as string) ?? '',
      contact_phone: (rec['contactPhone'] as string) ?? '',
      lob_id: mode === SimpleMode.Product
        ? (rec['lob_id'] ? (typeof rec['lob_id'] === 'string' ? rec['lob_id'].split(',') : rec['lob_id']) : [])
        : (rec['lob_id'] as string) ?? '',
      cob_id: mode === SimpleMode.Product
        ? (rec['cob_id'] ? (typeof rec['cob_id'] === 'string' ? rec['cob_id'].split(',') : rec['cob_id']) : [])
        : (rec['cob_id'] as string) ?? '',
      prefix: (rec['prefix'] as string) ?? '',
      next_value: (rec['next_value'] ?? rec['nextValue']) as number,
      padding_width: (rec['padding_width'] ?? rec['paddingWidth']) as number,
    };
    this.showModal = true;
  }

  openSimpleView(mode: SimpleMode, item: SimpleEditableItem): void {
    this.isEditMode = false;
    this.isViewMode = true;
    this.modalTitle = `View ${this.simpleMastersState.getMasterLabel(mode)}`;
    const rec = item as unknown as Record<string, unknown>;
    this.form = {
      id: item.id,
      code: (rec['code'] ??
        rec['lob_code'] ??
        rec['cob_code'] ??
        rec['reinsurer_company_id'] ??
        rec['product_id']) as string,
      name: item.name ?? '',
      is_active: item.is_active ?? false,
      description: (rec['description'] as string) ?? '',
      type: (rec['type'] as string) ?? '',
      taxable: (rec['taxable'] as boolean) ?? false,
      priority: (rec['priority'] as number) ?? 1,
      fully_earned: (rec['fully_earned'] as boolean) ?? false,
      contact_name: (rec['contactName'] as string) ?? '',
      contact_email: (rec['contactEmail'] as string) ?? '',
      contact_phone: (rec['contactPhone'] as string) ?? '',
      lob_id: mode === SimpleMode.Product
        ? (rec['lob_id'] ? (typeof rec['lob_id'] === 'string' ? rec['lob_id'].split(',') : rec['lob_id']) : [])
        : (rec['lob_id'] as string) ?? '',
      cob_id: mode === SimpleMode.Product
        ? (rec['cob_id'] ? (typeof rec['cob_id'] === 'string' ? rec['cob_id'].split(',') : rec['cob_id']) : [])
        : (rec['cob_id'] as string) ?? '',
      prefix: (rec['prefix'] as string) ?? '',
      next_value: (rec['next_value'] ?? rec['nextValue']) as number,
      padding_width: (rec['padding_width'] ?? rec['paddingWidth']) as number,
    };
    this.showModal = true;
  }

  submitSimple(formValue: SimpleFormValue): void {
    this.form = formValue;
    if (!this.form.code || !this.form.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.simpleMastersState.save(this.mode, this.isEditMode, this.form).subscribe({
      next: () => {
        this.toast.success(
          `${this.simpleMastersState.getMasterLabel(this.mode)} saved successfully`,
        );
        this.showModal = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save master data');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteSimple(mode: SimpleMode, item: SimpleEditableItem): void {
    this.confirmTitle = `Delete ${this.simpleMastersState.getMasterLabel(mode)}`;
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      if (!item.id) return;
      this.simpleMastersState.delete(mode, item.id).subscribe({
        next: () => {
          this.toast.success(`${this.simpleMastersState.getMasterLabel(mode)} deleted`);
          this.load();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete item');
        },
      });
    };
    this.confirmOpen = true;
  }

  onProductLobCobChange(): void {
    // handled inside SimpleFormModal itself
  }

  onConfirm(): void {
    this.pendingAction?.();
    this.confirmOpen = false;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }
}
