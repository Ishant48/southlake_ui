import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { ActiveStatusFilter } from '../../../../core/models/active-status-filter.model';
import { MastersGrid } from '../masters-grid/masters-grid';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotesModal } from '../../../../shared/components/notes-modal/notes-modal';
import { DocumentDrawer, DrawerDocument } from '../document-drawer/document-drawer';
import { RiskCompanyFormModal } from '../risk-company-form-modal/risk-company-form-modal';
import { RiskCompaniesState } from '../../services/risk-companies-state';
import { DocumentsDrawerState } from '../../services/documents-drawer-state';
import { StatesApi } from '../../services/states-api';
import { RiskCompany, StateMaster } from '../../models/master.model';
import { DocumentMode } from '../../models/master-tab.model';
import {
  RiskCompanyFormValue,
  createBlankRiskCompanyForm,
} from '../../models/risk-company-form.model';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { environment } from '../../../../../environments/environment';
import { GridOptions, ColDef } from 'ag-grid-community';
import { stateAbbrLabelFn } from '../../utils/label-fns.util';
import { downloadCsv } from '../../utils/csv-export.util';
import { buildRiskCompaniesExportData } from './risk-companies-tab.export';
import { buildRiskCompaniesColumnDefs } from '../../grid-columns/risk-companies-columns';
import { mapRiskCompanyToFormValue, buildRiskCompanyPayload } from './risk-companies-tab.util';

@Component({
  selector: 'app-risk-companies-tab',
  imports: [
    CommonModule,
    FormsModule,
    MastersGrid,
    RiskCompanyFormModal,
    NotesModal,
    DocumentDrawer,
    ConfirmDialogComponent,
  ],
  templateUrl: './risk-companies-tab.html',
})
export class RiskCompaniesTab implements OnInit {
  protected readonly stateAbbrLabelFn = stateAbbrLabelFn;

  riskCompaniesState = inject(RiskCompaniesState);
  documentsDrawerState = inject(DocumentsDrawerState);
  private statesApi = inject(StatesApi);
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
  form: RiskCompanyFormValue = createBlankRiskCompanyForm();

  stateOptions: StateMaster[] = [];

  showNotesModal = false;
  notesModalTitle = '';
  notesModalText = '';

  showDocModal = false;
  selectedItem: RiskCompany | null = null;
  uploadingDoc = false;
  selectedDocType = '';

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

  get currentList(): RiskCompany[] {
    return this.riskCompaniesState.riskCompanies;
  }

  get currentColumnDefs(): ColDef[] {
    return buildRiskCompaniesColumnDefs(this);
  }

  load(): void {
    this.loading = true;
    this.riskCompaniesState.load(this.searchTerm || undefined, this.activeFilterStatus).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Risk Companies');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange(): void {
    this.load();
  }

  exportToExcel(): void {
    const { headers, rows, filename } = buildRiskCompaniesExportData(this.riskCompaniesState);
    downloadCsv(headers, rows, filename);
  }

  openRiskCompanyAdd(): void {
    this.isEditMode = false;
    this.modalTitle = 'Add Risk Company';
    this.form = createBlankRiskCompanyForm();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openRiskCompanyEdit(rc: RiskCompany): void {
    this.isEditMode = true;
    this.modalTitle = `Edit Risk Company: ${rc.name}`;
    this.form = mapRiskCompanyToFormValue(rc);
    this.showModal = true;
  }

  submitRiskCompany(formValue: RiskCompanyFormValue): void {
    this.form = formValue;
    if (!this.form.risk_company_id) {
      this.form.risk_company_id = this.form.company_id
        ? 'RC-' + this.form.company_id
        : 'RC-' + Date.now();
    }
    if (!this.form.name) {
      this.toast.error('Name is required');
      return;
    }
    this.submitting = true;

    const payload = buildRiskCompanyPayload(this.form);

    if (this.isEditMode && !this.form.id) return;

    this.riskCompaniesState.save(this.isEditMode, this.form.id, payload).subscribe({
      next: () => {
        this.toast.success('Risk Company saved successfully');
        this.showModal = false;
        this.submitting = false;
        this.load();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save risk company');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteRiskCompany(rc: RiskCompany): void {
    this.confirmTitle = 'Delete Risk Company';
    this.confirmMessage = `Are you sure you want to delete risk company "${rc.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.riskCompaniesState.delete(rc.id).subscribe({
        next: () => {
          this.toast.success('Risk Company deleted successfully');
          this.load();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete risk company');
        },
      });
    };
    this.confirmOpen = true;
  }

  viewPolicy(rc: RiskCompany): void {
    this.toast.info(`View Policy clicked for risk company: ${rc.name}`);
  }

  openNotesModal(title: string, text: string | null | undefined): void {
    this.notesModalTitle = title;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also show the default "no notes" text
    this.notesModalText = text || 'No notes available.';
    this.showNotesModal = true;
  }

  get documentDrawerSubtitle(): string {
    if (!this.selectedItem) return '';
    return `${this.selectedItem.risk_company_id} - ${this.selectedItem.name}`;
  }

  openDocModal(_mode: DocumentMode, item: RiskCompany): void {
    this.selectedItem = item;
    this.selectedDocType = '';
    this.showDocModal = true;

    this.documentsDrawerState.loadDocumentTypes().subscribe(() => this.cdr.markForCheck());
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    this.documentsDrawerState
      .loadDocuments(DocumentMode.RiskCompany, this.selectedItem.id)
      .subscribe({
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
      .upload(DocumentMode.RiskCompany, this.selectedItem.id, file, documentType)
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
    const endpoint = this.documentsDrawerState.getDownloadEndpoint(DocumentMode.RiskCompany);
    window.open(
      `${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`,
      '_blank',
    );
  }

  deleteDoc(doc: DrawerDocument): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      this.documentsDrawerState.delete(DocumentMode.RiskCompany, doc.id).subscribe({
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
