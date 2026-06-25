import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';
import {
  StateMaster,
  StateDocument,
  MgaMaster,
  MgaDocument,
  ReinsurerCompany,
  RiskCompany,
  RiskCompanyDocument,
  LineOfBusiness,
  CobMaster,
  Treaty,
  TreatyState,
  TreatyLob,
} from '../../core/models/master.model';

type MasterTab = 'treaties' | 'mgas' | 'lobs' | 'cobs' | 'states' | 'reinsurers' | 'risk-companies';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentTab: MasterTab = 'treaties';
  loading = false;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Data lists
  treaties: Treaty[] = [];
  mgas: MgaMaster[] = [];
  lobs: LineOfBusiness[] = [];
  cobs: CobMaster[] = [];
  states: StateMaster[] = [];
  reinsurers: ReinsurerCompany[] = [];
  riskCompanies: RiskCompany[] = [];

  // Pagination
  pageSize = 25;
  currentPage = 1;

  // Simple Modals (LOB, COB, Reinsurer)
  showSimpleModal = false;
  simpleModalTitle = '';
  simpleMode: 'lob' | 'cob' | 'reinsurer' = 'lob';
  isEditMode = false;
  submitting = false;

  // Simple Form Binding
  simpleForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
  } = { code: '', name: '', is_active: true };

  // MGA Modal
  showMgaModal = false;
  mgaModalTitle = '';
  mgaForm: {
    id?: string;
    mga_code: string;
    name: string;
    tax_payable_inhouse: boolean;
    ledger_amount: number;
    is_active: boolean;
  } = { mga_code: '', name: '', tax_payable_inhouse: false, ledger_amount: 0, is_active: true };

  // State Modal
  showStateModal = false;
  stateModalTitle = '';
  stateForm: {
    id?: string;
    state_code: number | null;
    state_abbr: string;
    name: string;
    notes: string;
    is_active: boolean;
  } = { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };

  // Risk Company Modal
  showRiskCompanyModal = false;
  riskCompanyModalTitle = '';
  riskCompanyForm: {
    id?: string;
    risk_company_id: string;
    company_id: number | null;
    id_name: string;
    name: string;
    phone: string;
    is_admitted: boolean;
    state: string;
    notes: string;
    is_active: boolean;
  } = {
    risk_company_id: '',
    company_id: null,
    id_name: '',
    name: '',
    phone: '',
    is_admitted: true,
    state: '',
    notes: '',
    is_active: true,
  };

  // Generic Documents Drawer
  showDocModal = false;
  documentMode: 'mga' | 'state' | 'risk-company' = 'mga';
  selectedItem: any = null;
  documentsList: any[] = [];
  uploadingDoc = false;

  // Notes View Modal
  showNotesModal = false;
  notesModalTitle = '';
  notesModalText = '';

  // Treaty Modal
  showTreatyModal = false;
  treatyModalTitle = '';
  treatyForm: Partial<Treaty> & {
    state_ids: string[];
    lobs: { lob_id: string; cob_ids: string[] }[];
  } = {
    treaty_code: '',
    name: '',
    mga_id: '',
    reinsurer_id: null,
    risk_company_id: null,
    effective_date: '',
    expiration_date: '',
    qs_pct: 0,
    cf_pct: 0,
    comm_pct: 0,
    bb_pct: 0,
    ulae_pct: 0,
    xol_pct: 0,
    lr_cap_pct: 0,
    ibnr_pct: 0,
    carrier_retention_pct: 100,
    reinsurer_cession_pct: 0,
    is_active: true,
    state_ids: [],
    lobs: [],
  };

  // Treaty dropdown options
  mgaOptions: MgaMaster[] = [];
  reinsurerOptions: ReinsurerCompany[] = [];
  riskCompanyOptions: RiskCompany[] = [];
  stateOptions: StateMaster[] = [];
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];

  // Treaty UI selectors
  treatySelectedStates: { [stateId: string]: boolean } = {};
  treatySelectedLobs: { [lobId: string]: boolean } = {};
  treatyLobCobs: { [lobId: string]: { [cobId: string]: boolean } } = {};

  // Confirm dialog control
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MasterTab;
      if (tab && ['treaties', 'mgas', 'lobs', 'cobs', 'states', 'reinsurers', 'risk-companies'].includes(tab)) {
        this.currentTab = tab;
      } else {
        this.currentTab = 'treaties';
      }
      this.searchTerm = '';
      this.statusFilter = 'all';
      this.currentPage = 1;
      this.loadData();
    });
  }

  selectTab(tab: MasterTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  get activeFilterStatus(): boolean | undefined {
    if (this.statusFilter === 'active') return true;
    if (this.statusFilter === 'inactive') return false;
    return undefined;
  }

  loadData(): void {
    this.loading = true;
    const search = this.searchTerm || undefined;
    const active = this.activeFilterStatus;

    switch (this.currentTab) {
      case 'treaties':
        this.service.getTreaties(search, active).subscribe({
          next: (res) => { this.treaties = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load treaties'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'mgas':
        this.service.getMgas(search, active).subscribe({
          next: (res) => { this.mgas = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load MGAs'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'lobs':
        this.service.getLobs(search, active).subscribe({
          next: (res) => { this.lobs = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load LOBs'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'cobs':
        this.service.getCobs(search, active).subscribe({
          next: (res) => { this.cobs = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load COBs'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'states':
        this.service.getStates(search, active).subscribe({
          next: (res) => { this.states = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load States'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'reinsurers':
        this.service.getReinsurers(search, active).subscribe({
          next: (res) => { this.reinsurers = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load Reinsurers'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
      case 'risk-companies':
        this.service.getRiskCompanies(search, active).subscribe({
          next: (res) => { this.riskCompanies = res; this.loading = false; this.cdr.markForCheck(); },
          error: () => { this.toast.error('Failed to load Risk Companies'); this.loading = false; this.cdr.markForCheck(); }
        });
        break;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  // Pagination client-side helpers
  get paginatedItems(): any[] {
    const list = this.currentList;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get currentList(): any[] {
    switch (this.currentTab) {
      case 'treaties': return this.treaties;
      case 'mgas': return this.mgas;
      case 'lobs': return this.lobs;
      case 'cobs': return this.cobs;
      case 'states': return this.states;
      case 'reinsurers': return this.reinsurers;
      case 'risk-companies': return this.riskCompanies;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.currentList.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ==========================================
  // SIMPLE MASTERS ACTIONS
  // ==========================================
  openSimpleAdd(mode: typeof this.simpleMode): void {
    this.simpleMode = mode;
    this.isEditMode = false;
    this.simpleModalTitle = `Add New ${this.getMasterLabel(mode)}`;
    this.simpleForm = { code: '', name: '', is_active: true };
    this.showSimpleModal = true;
  }

  openSimpleEdit(mode: typeof this.simpleMode, item: any): void {
    this.simpleMode = mode;
    this.isEditMode = true;
    this.simpleModalTitle = `Edit ${this.getMasterLabel(mode)}`;
    this.simpleForm = {
      id: item.id,
      code: item.lob_code || item.cob_code || item.reinsurer_company_id || '',
      name: item.name,
      is_active: item.is_active,
    };
    this.showSimpleModal = true;
  }

  submitSimple(): void {
    if (!this.simpleForm.code || !this.simpleForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;

    const codeKey = this.getCodeKey(this.simpleMode);
    const payload: any = {
      [codeKey]: this.simpleForm.code,
      name: this.simpleForm.name,
      is_active: this.simpleForm.is_active,
    };

    let request!: Observable<any>;
    if (this.isEditMode) {
      const id = this.simpleForm.id!;
      switch (this.simpleMode) {
        case 'lob': request = this.service.updateLob(id, payload); break;
        case 'cob': request = this.service.updateCob(id, payload); break;
        case 'reinsurer': request = this.service.updateReinsurer(id, payload); break;
      }
    } else {
      switch (this.simpleMode) {
        case 'lob': request = this.service.createLob(payload); break;
        case 'cob': request = this.service.createCob(payload); break;
        case 'reinsurer': request = this.service.createReinsurer(payload); break;
      }
    }

    request.subscribe({
      next: () => {
        this.toast.success(`${this.getMasterLabel(this.simpleMode)} saved successfully`);
        this.showSimpleModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save master data');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteSimple(mode: typeof this.simpleMode, item: any): void {
    this.confirmTitle = `Delete ${this.getMasterLabel(mode)}`;
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      let request!: Observable<any>;
      switch (mode) {
        case 'lob': request = this.service.deleteLob(item.id); break;
        case 'cob': request = this.service.deleteCob(item.id); break;
        case 'reinsurer': request = this.service.deleteReinsurer(item.id); break;
      }
      request.subscribe({
        next: () => {
          this.toast.success(`${this.getMasterLabel(mode)} deleted`);
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete item');
        }
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // MGA MASTER ACTIONS
  // ==========================================
  openMgaAdd(): void {
    this.isEditMode = false;
    this.mgaModalTitle = 'Add MGA';
    this.mgaForm = { mga_code: '', name: '', tax_payable_inhouse: false, ledger_amount: 0, is_active: true };
    this.showMgaModal = true;
  }

  openMgaEdit(mga: MgaMaster): void {
    this.isEditMode = true;
    this.mgaModalTitle = `Edit MGA: ${mga.name}`;
    this.mgaForm = {
      id: mga.id,
      mga_code: mga.mga_code,
      name: mga.name,
      tax_payable_inhouse: mga.tax_payable_inhouse,
      ledger_amount: mga.ledger_amount || 0,
      is_active: mga.is_active,
    };
    this.showMgaModal = true;
  }

  submitMga(): void {
    if (!this.mgaForm.mga_code || !this.mgaForm.name) {
      this.toast.error('MGA Code and Name are required');
      return;
    }
    this.submitting = true;

    const payload = {
      ...this.mgaForm,
      ledger_amount: Number(this.mgaForm.ledger_amount || 0),
    };

    if (this.isEditMode) {
      this.service.updateMga(this.mgaForm.id!, payload).subscribe({
        next: () => {
          this.toast.success('MGA updated successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to update MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.service.createMga(payload).subscribe({
        next: () => {
          this.toast.success('MGA created successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to create MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteMga(mga: MgaMaster): void {
    this.confirmTitle = 'Delete MGA';
    this.confirmMessage = `Are you sure you want to delete MGA "${mga.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteMga(mga.id).subscribe({
        next: () => {
          this.toast.success('MGA deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete MGA');
        }
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // GENERIC DOCUMENTS DRAWER ACTIONS
  // ==========================================
  openDocModal(mode: 'mga' | 'state' | 'risk-company', item: any): void {
    this.documentMode = mode;
    this.selectedItem = item;
    this.documentsList = [];
    this.showDocModal = true;
    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;
    let request: Observable<any>;
    if (this.documentMode === 'mga') {
      request = this.service.getMga(id);
    } else if (this.documentMode === 'state') {
      request = this.service.getState(id);
    } else {
      request = this.service.getRiskCompany(id);
    }

    request.subscribe({
      next: (res) => {
        this.documentsList = res.documents || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load documents');
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file || !this.selectedItem) return;

    this.uploadingDoc = true;
    let request: Observable<any>;
    if (this.documentMode === 'mga') {
      request = this.service.uploadMgaDocument(this.selectedItem.id, file);
    } else if (this.documentMode === 'state') {
      request = this.service.uploadStateDocument(this.selectedItem.id, file);
    } else {
      request = this.service.uploadRiskCompanyDocument(this.selectedItem.id, file);
    }

    request.subscribe({
      next: () => {
        this.toast.success('Document uploaded successfully');
        this.loadDocuments();
        this.uploadingDoc = false;
        event.target.value = '';
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to upload document');
        this.uploadingDoc = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadDoc(doc: any): void {
    let endpoint = '';
    if (this.documentMode === 'mga') {
      endpoint = 'mgas';
    } else if (this.documentMode === 'state') {
      endpoint = 'states';
    } else {
      endpoint = 'risk-companies';
    }
    window.open(`${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`, '_blank');
  }

  deleteDoc(doc: any): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      let request: Observable<any>;
      if (this.documentMode === 'mga') {
        request = this.service.deleteMgaDocument(doc.id);
      } else if (this.documentMode === 'state') {
        request = this.service.deleteStateDocument(doc.id);
      } else {
        request = this.service.deleteRiskCompanyDocument(doc.id);
      }

      request.subscribe({
        next: () => {
          this.toast.success('Document deleted successfully');
          this.loadDocuments();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete document');
        }
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // STATE MASTER ACTIONS
  // ==========================================
  openStateAdd(): void {
    this.isEditMode = false;
    this.stateModalTitle = 'Add State';
    this.stateForm = { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };
    this.showStateModal = true;
  }

  openStateEdit(state: StateMaster): void {
    this.isEditMode = true;
    this.stateModalTitle = `Edit State: ${state.name}`;
    this.stateForm = {
      id: state.id,
      state_code: state.state_code,
      state_abbr: state.state_abbr,
      name: state.name,
      notes: state.notes || '',
      is_active: state.is_active,
    };
    this.showStateModal = true;
  }

  submitState(): void {
    if (this.stateForm.state_code === null || !this.stateForm.state_abbr || !this.stateForm.name) {
      this.toast.error('State Code, State Abbr, and Name are required');
      return;
    }
    this.submitting = true;

    const payload = {
      state_code: Number(this.stateForm.state_code),
      state_abbr: this.stateForm.state_abbr,
      name: this.stateForm.name,
      notes: this.stateForm.notes || null,
      is_active: this.stateForm.is_active,
    };

    let request: Observable<any>;
    if (this.isEditMode) {
      request = this.service.updateState(this.stateForm.id!, payload);
    } else {
      request = this.service.createState(payload);
    }

    request.subscribe({
      next: () => {
        this.toast.success('State saved successfully');
        this.showStateModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save state');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteState(state: StateMaster): void {
    this.confirmTitle = 'Delete State';
    this.confirmMessage = `Are you sure you want to delete state "${state.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteState(state.id).subscribe({
        next: () => {
          this.toast.success('State deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete state');
        }
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // RISK COMPANY MASTER ACTIONS
  // ==========================================
  openRiskCompanyAdd(): void {
    this.isEditMode = false;
    this.riskCompanyModalTitle = 'Add Risk Company';
    this.riskCompanyForm = {
      risk_company_id: '',
      company_id: null,
      id_name: '',
      name: '',
      phone: '',
      is_admitted: true,
      state: '',
      notes: '',
      is_active: true,
    };
    this.showRiskCompanyModal = true;
  }

  openRiskCompanyEdit(rc: RiskCompany): void {
    this.isEditMode = true;
    this.riskCompanyModalTitle = `Edit Risk Company: ${rc.name}`;
    this.riskCompanyForm = {
      id: rc.id,
      risk_company_id: rc.risk_company_id,
      company_id: rc.company_id,
      id_name: rc.id_name || '',
      name: rc.name,
      phone: rc.phone || '',
      is_admitted: rc.is_admitted,
      state: rc.state || '',
      notes: rc.notes || '',
      is_active: rc.is_active,
    };
    this.showRiskCompanyModal = true;
  }

  submitRiskCompany(): void {
    if (!this.riskCompanyForm.risk_company_id || !this.riskCompanyForm.name) {
      this.toast.error('Risk Company Code and Name are required');
      return;
    }
    this.submitting = true;

    const payload = {
      risk_company_id: this.riskCompanyForm.risk_company_id,
      company_id: this.riskCompanyForm.company_id ? Number(this.riskCompanyForm.company_id) : null,
      id_name: this.riskCompanyForm.id_name || null,
      name: this.riskCompanyForm.name,
      phone: this.riskCompanyForm.phone || null,
      is_admitted: this.riskCompanyForm.is_admitted,
      state: this.riskCompanyForm.state || null,
      notes: this.riskCompanyForm.notes || null,
      is_active: this.riskCompanyForm.is_active,
    };

    let request: Observable<any>;
    if (this.isEditMode) {
      request = this.service.updateRiskCompany(this.riskCompanyForm.id!, payload);
    } else {
      request = this.service.createRiskCompany(payload);
    }

    request.subscribe({
      next: () => {
        this.toast.success('Risk Company saved successfully');
        this.showRiskCompanyModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save risk company');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteRiskCompany(rc: RiskCompany): void {
    this.confirmTitle = 'Delete Risk Company';
    this.confirmMessage = `Are you sure you want to delete risk company "${rc.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteRiskCompany(rc.id).subscribe({
        next: () => {
          this.toast.success('Risk Company deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete risk company');
        }
      });
    };
    this.confirmOpen = true;
  }

  viewPolicy(rc: RiskCompany): void {
    this.toast.info(`View Policy clicked for risk company: ${rc.name}`);
  }

  // ==========================================
  // NOTES VIEW MODAL ACTIONS
  // ==========================================
  openNotesModal(title: string, text: string | null | undefined): void {
    this.notesModalTitle = title;
    this.notesModalText = text || 'No notes available.';
    this.showNotesModal = true;
  }

  // ==========================================
  // TREATY MASTER ACTIONS
  // ==========================================
  loadTreatyOptions(): void {
    this.service.getMgas(undefined, true).subscribe(res => { this.mgaOptions = res; this.cdr.markForCheck(); });
    this.service.getReinsurers(undefined, true).subscribe(res => { this.reinsurerOptions = res; this.cdr.markForCheck(); });
    this.service.getRiskCompanies(undefined, true).subscribe(res => { this.riskCompanyOptions = res; this.cdr.markForCheck(); });
    this.service.getLobs(undefined, true).subscribe(res => { this.lobOptions = res; this.cdr.markForCheck(); });
    this.service.getCobs(undefined, true).subscribe(res => { this.cobOptions = res; this.cdr.markForCheck(); });
    this.service.getStates(undefined, true).subscribe(res => { this.stateOptions = res; this.cdr.markForCheck(); });
  }

  openTreatyAdd(): void {
    this.isEditMode = false;
    this.treatyModalTitle = 'Create Treaty';
    this.loadTreatyOptions();

    this.treatyForm = {
      treaty_code: '',
      name: '',
      mga_id: '',
      reinsurer_id: null,
      risk_company_id: null,
      effective_date: '',
      expiration_date: '',
      qs_pct: 0,
      cf_pct: 0,
      comm_pct: 0,
      bb_pct: 0,
      ulae_pct: 0,
      xol_pct: 0,
      lr_cap_pct: 0,
      ibnr_pct: 0,
      carrier_retention_pct: 100,
      reinsurer_cession_pct: 0,
      is_active: true,
      state_ids: [],
      lobs: [],
    };

    this.treatySelectedStates = {};
    this.treatySelectedLobs = {};
    this.treatyLobCobs = {};
    this.showTreatyModal = true;
  }

  openTreatyEdit(treaty: Treaty): void {
    this.isEditMode = true;
    this.treatyModalTitle = `Edit Treaty: ${treaty.treaty_code}`;
    this.loadTreatyOptions();

    this.treatyForm = {
      id: treaty.id,
      treaty_code: treaty.treaty_code,
      name: treaty.name,
      mga_id: treaty.mga_id,
      reinsurer_id: treaty.reinsurer_id,
      risk_company_id: treaty.risk_company_id,
      effective_date: treaty.effective_date ? new Date(treaty.effective_date).toISOString().slice(0, 10) : '',
      expiration_date: treaty.expiration_date ? new Date(treaty.expiration_date).toISOString().slice(0, 10) : '',
      qs_pct: treaty.qs_pct,
      cf_pct: treaty.cf_pct,
      comm_pct: treaty.comm_pct,
      bb_pct: treaty.bb_pct,
      ulae_pct: treaty.ulae_pct,
      xol_pct: treaty.xol_pct,
      lr_cap_pct: treaty.lr_cap_pct,
      ibnr_pct: treaty.ibnr_pct,
      carrier_retention_pct: treaty.carrier_retention_pct,
      reinsurer_cession_pct: treaty.reinsurer_cession_pct,
      is_active: treaty.is_active,
      state_ids: [],
      lobs: [],
    };

    // Prepopulate selections
    this.treatySelectedStates = {};
    if (treaty.treaty_states) {
      treaty.treaty_states.forEach(ts => {
        this.treatySelectedStates[ts.state_id] = true;
      });
    }

    this.treatySelectedLobs = {};
    this.treatyLobCobs = {};
    if (treaty.treaty_lobs) {
      treaty.treaty_lobs.forEach(tl => {
        this.treatySelectedLobs[tl.lob_id] = true;
        this.treatyLobCobs[tl.lob_id] = {};
        if (tl.treaty_lob_cobs) {
          tl.treaty_lob_cobs.forEach(tlc => {
            this.treatyLobCobs[tl.lob_id][tlc.cob_id] = true;
          });
        }
      });
    }

    this.showTreatyModal = true;
  }

  submitTreaty(): void {
    if (!this.treatyForm.treaty_code || !this.treatyForm.name || !this.treatyForm.mga_id) {
      this.toast.error('Treaty Code, Name and MGA are required');
      return;
    }
    this.submitting = true;

    // Build state_ids
    const state_ids = Object.keys(this.treatySelectedStates).filter(k => this.treatySelectedStates[k]);

    // Build lobs structure
    const lobs = Object.keys(this.treatySelectedLobs)
      .filter(lobId => this.treatySelectedLobs[lobId])
      .map(lobId => {
        const cobsForLob = this.treatyLobCobs[lobId] || {};
        const cob_ids = Object.keys(cobsForLob).filter(cobId => cobsForLob[cobId]);
        return {
          lob_id: lobId,
          cob_ids,
        };
      });

    const payload = {
      ...this.treatyForm,
      effective_date: this.treatyForm.effective_date || null,
      expiration_date: this.treatyForm.expiration_date || null,
      state_ids,
      lobs,
    };

    let request;
    if (this.isEditMode) {
      request = this.service.updateTreaty(this.treatyForm.id!, payload);
    } else {
      request = this.service.createTreaty(payload);
    }

    request.subscribe({
      next: () => {
        this.toast.success('Treaty saved successfully');
        this.showTreatyModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save treaty');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteTreaty(treaty: Treaty): void {
    this.confirmTitle = 'Delete Treaty';
    this.confirmMessage = `Are you sure you want to delete treaty "${treaty.treaty_code}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteTreaty(treaty.id).subscribe({
        next: () => {
          this.toast.success('Treaty deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete treaty');
        }
      });
    };
    this.confirmOpen = true;
  }

  getStatesListDisplay(states?: TreatyState[]): string {
    if (!states || states.length === 0) return '-';
    return states.map(s => s.state?.state_code).filter(Boolean).join(', ');
  }

  getLobsListDisplay(lobs?: TreatyLob[]): string {
    if (!lobs || lobs.length === 0) return '-';
    return lobs.map(l => {
      const lobName = l.lob?.lob_code;
      const cobs = l.treaty_lob_cobs?.map(c => c.cob?.cob_code).filter(Boolean).join('/');
      return cobs ? `${lobName} (${cobs})` : lobName;
    }).filter(Boolean).join(', ');
  }

  // ==========================================
  // CONFIRM MODAL ACTIONS
  // ==========================================
  onConfirm(): void {
    if (this.pendingAction) this.pendingAction();
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  // ==========================================
  // HELPERS
  // ==========================================
  private getMasterLabel(mode: string): string {
    switch (mode) {
      case 'state': return 'State';
      case 'lob': return 'Line of Business';
      case 'cob': return 'Class of Business';
      case 'reinsurer': return 'Reinsurer Company';
      case 'risk-company': return 'Risk Company';
      default: return 'Master';
    }
  }

  private getCodeKey(mode: string): string {
    switch (mode) {
      case 'state': return 'state_code';
      case 'lob': return 'lob_code';
      case 'cob': return 'cob_code';
      case 'reinsurer': return 'reinsurer_company_id';
      case 'risk-company': return 'risk_company_id';
      default: return 'code';
    }
  }

  exportToExcel(): void {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    switch (this.currentTab) {
      case 'treaties':
        headers = ['Code', 'Treaty Name', 'MGA', 'Risk Company', 'States', 'LOBs (COBs)', 'Status'];
        rows = this.treaties.map(t => [
          t.treaty_code,
          t.name,
          t.mga?.name || '-',
          t.risk_company?.name || '-',
          this.getStatesListDisplay(t.treaty_states),
          this.getLobsListDisplay(t.treaty_lobs),
          t.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'treaties.csv';
        break;

      case 'mgas':
        headers = ['MGA Code', 'MGA Name', 'Tax Payable In-house', 'Ledger Amount', 'Status'];
        rows = this.mgas.map(m => [
          m.mga_code,
          m.name,
          m.tax_payable_inhouse ? 'Yes' : 'No',
          m.ledger_amount !== undefined ? `$${m.ledger_amount.toFixed(2)}` : '$0.00',
          m.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'mgas.csv';
        break;

      case 'states':
        headers = ['State Code', 'State Abbr', 'State Name', 'Status'];
        rows = this.states.map(s => [
          s.state_code,
          s.state_abbr,
          s.name,
          s.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'states.csv';
        break;

      case 'risk-companies':
        headers = ['Company', 'ID Name', 'Name', 'Phone', 'Admitted', 'State', 'Status'];
        rows = this.riskCompanies.map(r => [
          r.company_id,
          r.id_name || '-',
          r.name,
          r.phone || '-',
          r.is_admitted ? 'Yes' : 'No',
          r.state || '-',
          r.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'risk_companies.csv';
        break;

      case 'lobs':
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.lobs.map(l => [
          l.lob_code,
          l.name,
          l.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'lobs.csv';
        break;

      case 'cobs':
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.cobs.map(c => [
          c.cob_code,
          c.name,
          c.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'cobs.csv';
        break;

      case 'reinsurers':
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'reinsurers.csv';
        break;
    }

    this.downloadCSV(headers, rows, filename);
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
