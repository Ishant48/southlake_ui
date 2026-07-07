import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridOptions, ColDef } from 'ag-grid-community';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { ActiveStatusFilter } from '../../../../core/models/active-status-filter.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { MastersGrid } from '../masters-grid/masters-grid';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotesModal } from '../../../../shared/components/notes-modal/notes-modal';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { DocumentDrawer, DrawerDocument } from '../document-drawer/document-drawer';
import { StateFormModal } from '../state-form-modal/state-form-modal';
import { StatesState } from '../../services/states-state';
import { DocumentsDrawerState } from '../../services/documents-drawer-state';
import { StateFormValue, createBlankStateForm } from '../../models/state-form.model';
import { StateMaster } from '../../models/master.model';
import { DocumentMode } from '../../models/master-tab.model';
import { buildStatesColumnDefs } from '../../grid-columns/states-columns';
import { buildStatesExportData } from './states-tab.export';
import { downloadCsv } from '../../utils/csv-export.util';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-states-tab',
  imports: [
    CommonModule,
    FormsModule,
    MastersGrid,
    StateFormModal,
    NotesModal,
    DocumentDrawer,
    ConfirmDialogComponent,
  ],
  templateUrl: './states-tab.html',
})
export class StatesTab implements OnInit {
  statesState = inject(StatesState);
  documentsDrawerState = inject(DocumentsDrawerState);
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
  submitting = false;
  form: StateFormValue = createBlankStateForm();

  // Generic Documents Drawer (State mode only)
  showDocModal = false;
  selectedItem: StateMaster | null = null;
  selectedDocType = '';
  uploadingDoc = false;

  // Notes View Modal
  showNotesModal = false;
  notesModalTitle = '';
  notesModalText = '';

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.load();
  }

  get activeFilterStatus(): boolean | undefined {
    if (this.statusFilter === ActiveStatusFilter.Active) return true;
    if (this.statusFilter === ActiveStatusFilter.Inactive) return false;
    return undefined;
  }

  get currentList(): StateMaster[] {
    return this.statesState.states;
  }

  get currentColumnDefs(): ColDef[] {
    return buildStatesColumnDefs(this);
  }

  load(): void {
    this.loading = true;
    this.statesState.load(this.searchTerm || undefined, this.activeFilterStatus).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load States');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildStatesExportData(this.statesState);
    downloadCsv(headers, rows, filename);
  }

  // ==========================================
  // STATE MASTER ACTIONS
  // ==========================================
  openStateAdd(): void {
    this.isEditMode = false;
    this.modalTitle = 'Add State';
    this.form = createBlankStateForm();
    this.showModal = true;
  }

  openStateEdit(state: StateMaster): void {
    this.isEditMode = true;
    this.modalTitle = `Edit State: ${state.name}`;
    this.form = {
      id: state.id,
      state_code: state.state_code,
      state_abbr: state.state_abbr,
      name: state.name,
      notes: state.notes ?? '',
      is_active: state.is_active,
    };
    this.showModal = true;
  }

  submitState(formValue: StateFormValue): void {
    this.form = formValue;
    if (this.form.state_code === null || !this.form.state_abbr || !this.form.name) {
      this.toast.error('State Code, State Abbr, and Name are required');
      return;
    }
    this.submitting = true;

    const payload = {
      state_code: Number(this.form.state_code),
      state_abbr: this.form.state_abbr,
      name: this.form.name,
      notes: this.form.notes || null,
      is_active: this.form.is_active,
    };

    if (this.isEditMode && !this.form.id) return;

    this.statesState.save(this.isEditMode, this.form.id, payload).subscribe({
      next: () => {
        this.toast.success('State saved successfully');
        this.showModal = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save state');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteState(state: StateMaster): void {
    this.confirmTitle = 'Delete State';
    this.confirmMessage = `Are you sure you want to delete state "${state.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.statesState.delete(state.id).subscribe({
        next: () => {
          this.toast.success('State deleted successfully');
          this.load();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete state');
        },
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // GENERIC DOCUMENTS DRAWER ACTIONS (State mode only)
  // ==========================================
  get documentDrawerSubtitle(): string {
    if (!this.selectedItem) return '';
    return `${this.selectedItem.state_abbr} - ${this.selectedItem.name}`;
  }

  openDocModal(mode: DocumentMode, item: StateMaster): void {
    this.selectedItem = item;
    this.selectedDocType = '';
    this.showDocModal = true;

    this.documentsDrawerState.loadDocumentTypes().subscribe(() => this.cdr.markForCheck());
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    this.documentsDrawerState.loadDocuments(DocumentMode.State, this.selectedItem.id).subscribe({
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
      .upload(DocumentMode.State, this.selectedItem.id, file, documentType)
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
    const endpoint = this.documentsDrawerState.getDownloadEndpoint(DocumentMode.State);
    window.open(
      `${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`,
      '_blank',
    );
  }

  deleteDoc(doc: DrawerDocument): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      this.documentsDrawerState.delete(DocumentMode.State, doc.id).subscribe({
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

  // ==========================================
  // NOTES VIEW MODAL ACTIONS
  // ==========================================
  openNotesModal(title: string, text: string | null | undefined): void {
    this.notesModalTitle = title;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also show the default "no notes" text
    this.notesModalText = text || 'No notes available.';
    this.showNotesModal = true;
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
