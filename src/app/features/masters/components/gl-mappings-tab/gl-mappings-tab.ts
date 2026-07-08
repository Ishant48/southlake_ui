import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColDef, GridOptions } from 'ag-grid-community';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { MastersGrid } from '../masters-grid/masters-grid';
import { GlMappingFormModal } from '../gl-mapping-form-modal/gl-mapping-form-modal';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { GlMappingsState } from '../../services/gl-mappings-state';
import { GlMapping, GlMappingType } from '../../models/gl-mapping.model';
import { GlMappingFormValue, createBlankGlMappingForm } from '../../models/gl-mapping-form.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { coaLabelFn, nameLabelFn } from '../../utils/label-fns.util';
import { buildGlMappingsColumnDefs } from '../../grid-columns/gl-mappings-columns';
import { downloadCsv } from '../../utils/csv-export.util';
import { buildGlMappingsExportData } from './gl-mappings-tab.export';

@Component({
  selector: 'app-gl-mappings-tab',
  imports: [CommonModule, FormsModule, MastersGrid, GlMappingFormModal, ConfirmDialogComponent],
  templateUrl: './gl-mappings-tab.html',
})
export class GlMappingsTab implements OnInit {
  protected readonly coaLabelFn = coaLabelFn;
  protected readonly nameLabelFn = nameLabelFn;
  protected readonly glMappingTypeOptionsList = Object.values(GlMappingType).map(type => ({
    id: type,
    name: type,
  }));

  glMappingsState = inject(GlMappingsState);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();
  loading = false;
  searchTerm = '';

  showModal = false;
  modalTitle = 'Add GL Mapping';
  isEditMode = false;
  isViewMode = false;
  submitting = false;
  form: GlMappingFormValue = createBlankGlMappingForm();

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.load();
  }

  get currentList(): GlMapping[] {
    return this.glMappingsState.glMappings;
  }

  get currentColumnDefs(): ColDef[] {
    return buildGlMappingsColumnDefs(this);
  }

  load(): void {
    this.loading = true;
    this.glMappingsState.load(this.searchTerm).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load GL mappings');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildGlMappingsExportData(this.glMappingsState);
    downloadCsv(headers, rows, filename);
  }

  loadCoaOptions(): void {
    this.glMappingsState.loadCoaOptions().subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Chart of Accounts options');
      },
    });
  }

  openGlMappingView(mapping: GlMapping): void {
    this.isEditMode = false;
    this.isViewMode = true;
    this.modalTitle = 'View GL Mapping';
    this.form = {
      id: mapping.id,
      coa_id: mapping.coa_id,
      type: mapping.type,
    };
    this.loadCoaOptions();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  openGlMappingAdd(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.modalTitle = 'Add GL Mapping';
    this.form = createBlankGlMappingForm();
    this.loadCoaOptions();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openGlMappingEdit(mapping: GlMapping): void {
    this.isEditMode = true;
    this.isViewMode = false;
    this.modalTitle = 'Edit GL Mapping';
    this.form = {
      id: mapping.id,
      coa_id: mapping.coa_id,
      type: mapping.type,
    };
    this.loadCoaOptions();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  submitGlMapping(formValue: GlMappingFormValue): void {
    this.form = formValue;
    if (!this.form.coa_id || !this.form.type) {
      this.toast.error('Both Chart of Account and Mapping Type are required');
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      coa_id: this.form.coa_id,
      type: this.form.type,
    };

    const isUpdate = this.isEditMode && !!this.form.id;
    this.glMappingsState.save(this.isEditMode, this.form.id, payload).subscribe({
      next: () => {
        this.toast.success(`GL Mapping ${isUpdate ? 'updated' : 'created'} successfully`);
        this.showModal = false;
        this.isViewMode = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        const msg = err.error?.message || `Failed to ${isUpdate ? 'update' : 'create'} GL mapping`;
        this.toast.error(msg);
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteGlMapping(mapping: GlMapping): void {
    this.confirmTitle = 'Delete GL Mapping';
    const coaDesc = mapping.coa ? `${mapping.coa.account_code} - ${mapping.coa.description}` : (mapping.coa_id || 'GL Mapping');
    this.confirmMessage = `Are you sure you want to delete the GL Mapping for "${coaDesc}" (${mapping.type})? This action cannot be undone.`;
    this.pendingAction = () => {
      this.glMappingsState.delete(mapping.id).subscribe({
        next: () => {
          this.toast.success('GL Mapping deleted successfully');
          this.load();
        },
        error: () => {
          this.toast.error('Failed to delete GL mapping');
        },
      });
    };
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  getGLNumberDisplay(mapping: GlMapping): string {
    return this.glMappingsState.getGLNumberDisplay(mapping);
  }

  onConfirm(): void {
    if (this.pendingAction) this.pendingAction();
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }
}
