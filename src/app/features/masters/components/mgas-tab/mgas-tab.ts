import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GridOptions, ColDef } from 'ag-grid-community';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { ActiveStatusFilter } from '../../../../core/models/active-status-filter.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { MastersGrid } from '../masters-grid/masters-grid';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DocumentDrawer, DrawerDocument } from '../document-drawer/document-drawer';
import { MgaFormModal } from '../mga-form-modal/mga-form-modal';
import { MgasState } from '../../services/mgas-state';
import { DocumentsDrawerState } from '../../services/documents-drawer-state';
import { StatesApi } from '../../services/states-api';
import { MgaMaster, StateMaster } from '../../models/master.model';
import { MasterTab, DocumentMode } from '../../models/master-tab.model';
import { MgaFormValue, createBlankMgaForm } from '../../models/mga-form.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { environment } from '../../../../../environments/environment';
import { stateAbbrLabelFn } from '../../utils/label-fns.util';
import { downloadCsv } from '../../utils/csv-export.util';
import { buildMgasExportData } from './mgas-tab.export';
import { buildMgasColumnDefs } from '../../grid-columns/mgas-columns';
import { mapMgaToFormValue, buildMgaPayload } from './mgas-tab.util';
import { TreatyQuickAddState } from '../../services/treaty-quick-add-state';
import { StatusBadgeCell } from '../../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';

@Component({
  selector: 'app-mgas-tab',
  imports: [
    CommonModule,
    FormsModule,
    MastersGrid,
    MgaFormModal,
    DocumentDrawer,
    ConfirmDialogComponent,
  ],
  templateUrl: './mgas-tab.html',
})
export class MgasTab implements OnInit {
  protected readonly stateAbbrLabelFn = stateAbbrLabelFn;

  mgasState = inject(MgasState);
  documentsDrawerState = inject(DocumentsDrawerState);
  private statesApi = inject(StatesApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private treatyQuickAddState = inject(TreatyQuickAddState);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();
  loading = false;
  searchTerm = '';
  statusFilter: ActiveStatusFilter = ActiveStatusFilter.All;

  showModal = false;
  modalTitle = '';
  isEditMode = false;
  submitting = false;
  form: MgaFormValue = createBlankMgaForm();

  stateOptions: StateMaster[] = [];

  // Generic Documents Drawer (Mga mode only)
  showDocModal = false;
  selectedItem: MgaMaster | null = null;
  selectedDocType = '';
  uploadingDoc = false;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.load();
    this.statesApi.getStates(undefined, true).subscribe(res => {
      this.stateOptions = res;
      this.cdr.markForCheck();
    });
  }

  get activeFilterStatus(): boolean | undefined {
    if (this.statusFilter === ActiveStatusFilter.Active) return true;
    if (this.statusFilter === ActiveStatusFilter.Inactive) return false;
    return undefined;
  }

  get currentList(): MgaMaster[] {
    return this.mgasState.mgas;
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
    return buildMgasColumnDefs(this, statusCol);
  }

  load(): void {
    this.loading = true;
    this.mgasState.load(this.searchTerm || undefined, this.activeFilterStatus).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load MGAs');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildMgasExportData(this.mgasState);
    downloadCsv(headers, rows, filename);
  }

  // ==========================================
  // MGA MASTER ACTIONS
  // ==========================================
  openMgaAdd(): void {
    this.isEditMode = false;
    this.modalTitle = 'Add MGA';
    this.form = createBlankMgaForm();
    this.showModal = true;
  }

  openMgaEdit(mga: MgaMaster): void {
    this.isEditMode = true;
    this.modalTitle = `Edit MGA: ${mga.name}`;
    this.form = mapMgaToFormValue(mga);
    this.showModal = true;
  }

  submitMga(formValue: MgaFormValue): void {
    this.form = formValue;
    if (!this.form.mga_code || !this.form.name) {
      this.toast.error('MGA Code and Name are required');
      return;
    }
    this.submitting = true;

    const payload = buildMgaPayload(this.form);

    if (this.isEditMode && !this.form.id) return;
    const isUpdate = this.isEditMode;

    this.mgasState.save(isUpdate, this.form.id, payload).subscribe({
      next: () => {
        this.toast.success(`MGA ${isUpdate ? 'updated' : 'created'} successfully`);
        this.showModal = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || `Failed to ${isUpdate ? 'update' : 'create'} MGA`);
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteMga(mga: MgaMaster): void {
    this.confirmTitle = 'Delete MGA';
    this.confirmMessage = `Are you sure you want to delete MGA "${mga.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.mgasState.delete(mga.id).subscribe({
        next: () => {
          this.toast.success('MGA deleted successfully');
          this.load();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete MGA');
        },
      });
    };
    this.confirmOpen = true;
  }

  // Cross-tab navigation: switches to the Treaties tab and carries the mga id
  // via a shared state service, which TreatiesTab reads on init to pre-fill
  // the Add Treaty modal (no query param mutation, so sidebar/tab-bar active
  // state stays in sync).
  openTreatyAdd(mgaId: string): void {
    this.treatyQuickAddState.pendingMgaId = mgaId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: MasterTab.Treaties },
      queryParamsHandling: 'merge',
    });
  }

  // ==========================================
  // GENERIC DOCUMENTS DRAWER ACTIONS (Mga mode only)
  // ==========================================
  get documentDrawerSubtitle(): string {
    if (!this.selectedItem) return '';
    return `${this.selectedItem.mga_code} - ${this.selectedItem.name}`;
  }

  openDocModal(mode: DocumentMode, item: MgaMaster): void {
    this.selectedItem = item;
    this.selectedDocType = '';
    this.showDocModal = true;

    this.documentsDrawerState.loadDocumentTypes().subscribe(() => this.cdr.markForCheck());
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    this.documentsDrawerState.loadDocuments(DocumentMode.Mga, this.selectedItem.id).subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load documents');
      },
    });
  }

  onDocumentUpload(payload: { file: File; documentType: string }): void {
    if (!this.selectedItem) return;
    const { file, documentType } = payload;

    this.uploadingDoc = true;
    this.documentsDrawerState
      .upload(DocumentMode.Mga, this.selectedItem.id, file, documentType)
      .subscribe({
        next: () => {
          this.toast.success('Document uploaded successfully');
          this.loadDocuments();
          this.uploadingDoc = false;
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorLike) => {
          this.toast.error(err.error?.message ?? 'Failed to upload document');
          this.uploadingDoc = false;
          this.cdr.markForCheck();
        },
      });
  }

  downloadDoc(doc: DrawerDocument): void {
    const endpoint = this.documentsDrawerState.getDownloadEndpoint(DocumentMode.Mga);
    window.open(
      `${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`,
      '_blank',
    );
  }

  deleteDoc(doc: DrawerDocument): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      this.documentsDrawerState.delete(DocumentMode.Mga, doc.id).subscribe({
        next: () => {
          this.toast.success('Document deleted successfully');
          this.loadDocuments();
        },
        error: (err: HttpErrorLike) => {
          this.toast.error(err.error?.message ?? 'Failed to delete document');
        },
      });
    };
    this.confirmOpen = true;
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
