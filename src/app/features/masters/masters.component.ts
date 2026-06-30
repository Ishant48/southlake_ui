import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../shared/components/dropdown-search/dropdown-search.component';
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
import { GlMappingsService } from '../../core/services/gl-mappings.service';
import { ChartOfAccountsService } from '../../core/services/chart-of-accounts.service';
import { GlMapping } from '../../core/models/gl-mapping.model';
import { ChartOfAccount } from '../../core/models/chart-of-account.model';
import { ReinsuranceService } from '../../core/services/reinsurance.service';

type MasterTab = 'treaties' | 'mgas' | 'lobs' | 'cobs' | 'states' | 'reinsurers' | 'risk-companies' | 'gl-mappings';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, DropdownSearchComponent],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  // Label formatters for searchable dropdowns
  mgaLabelFn = (item: any) => item ? `${item.name} (${item.mga_code})` : '';
  riskCompanyLabelFn = (item: any) => item ? `${item.name} (${item.risk_company_id})` : '';
  reinsurerLabelFn = (item: any) => item ? `${item.name} (${item.reinsurer_company_id})` : '';
  stateLabelFn = (item: any) => item ? `${item.state_code} - ${item.name}` : '';
  stateAbbrLabelFn = (item: any) => item ? `${item.state_abbr} - ${item.name}` : '';
  lobLabelFn = (item: any) => item ? `${item.name} (${item.lob_code})` : '';
  cobLabelFn = (item: any) => item ? `${item.name} (${item.cob_code})` : '';
  coaLabelFn = (item: any) => item ? `${item.account_code} - ${item.description}` : '';
  nameLabelFn = (item: any) => item ? item.name : '';

  simpleFormTypeOptions = [
    { id: 'Property', name: 'Property' },
    { id: 'Liability', name: 'Liability' },
    { id: 'Automobile', name: 'Automobile' },
    { id: 'Workers Comp', name: 'Workers Comp' },
    { id: 'Other', name: 'Other' }
  ];

  glMappingTypeOptionsList = [
    { id: 'AR', name: 'AR' },
    { id: 'AP', name: 'AP' },
    { id: 'MGA', name: 'MGA' },
    { id: 'BRK', name: 'BRK' }
  ];
  private service = inject(MastersService);
  private reinsuranceService = inject(ReinsuranceService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private glMappingsService = inject(GlMappingsService);
  private coaService = inject(ChartOfAccountsService);

  currentTab: MasterTab = 'treaties';
  glMappings: GlMapping[] = [];
  coaOptions: ChartOfAccount[] = [];
  showGlMappingModal = false;
  glMappingModalTitle = 'Add GL Mapping';
  glMappingForm: Partial<GlMapping> = {
    coa_id: '',
    type: '',
  };
  glMappingTypeOptions = ['AR', 'AP', 'MGA', 'BRK'];
  loading = false;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  mgaFilter: string = 'all';
  seededProgramITD = new Set<string>();
  treatyWorkbookStatuses = new Map<string, string>();


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
    description: string;
    type: string;
    taxable: boolean;
    priority: number;
    fully_earned: boolean;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    type: '',
    taxable: false,
    priority: 1,
    fully_earned: false
  };

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
    company_id: number | null;
    id_name: string;
    address: string;
    zip: string;
    city: string;
    state: string;
    phone: string;
    open_item: boolean;
    op_start_date: string;
    other_names: { state: string; displayName: string }[];
  } = {
    mga_code: '',
    name: '',
    tax_payable_inhouse: false,
    ledger_amount: 0,
    is_active: true,
    company_id: null,
    id_name: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    phone: '',
    open_item: false,
    op_start_date: '',
    other_names: []
  };

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
    address: string;
    zip: string;
    city: string;
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
    address: '',
    zip: '',
    city: '',
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

  // ITD Modal Control
  showItdModal = false;
  selectedTreatyForItd: any = null;
  itdForm: any = {
    program: '',
    month_key: '2025-12',
    month_label: 'December 2025',
    rates: {
      qs: 100,
      cf: 5,
      comm: 29,
      ulae: 7,
      boards_charge: 0.4,
      loss_ratio_cap: 2,
      loss_pick: 5,
      lae_dcc: 7,
      lae_aoe: 7
    },
    exhibits: {}
  };
  itdSelectedStateCode = 'TOTAL';
  itdStatesList: any[] = [{ code: 'TOTAL', label: 'TOTAL' }];
  itdSelectedMonth = '12';
  itdSelectedYear = '2025';
  monthsList = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  yearsList = ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  onItdMonthYearChange(): void {
    const monthObj = this.monthsList.find(m => m.value === this.itdSelectedMonth);
    const monthLabel = monthObj ? monthObj.label : 'December';
    this.itdForm.month_key = `${this.itdSelectedYear}-${this.itdSelectedMonth}`;
    this.itdForm.month_label = `${monthLabel} ${this.itdSelectedYear}`;
  }

  // Treaty Modal
  showTreatyModal = false;
  treatyModalTitle = '';
  treatyForm: Partial<Treaty> & {
    state_ids: string[];
    lobs: { lob_id: string; cob_ids: string[] }[];
    carriers: { risk_company_id: string; retention_pct: number }[];
    reinsurers: { reinsurer_id: string; cession_pct: number }[];
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
    carriers: [],
    reinsurers: [],
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
  treatySelectedMgas: { [mgaId: string]: boolean } = {};
  treatySelectedLobs: { [lobId: string]: boolean } = {};
  treatySelectedCobs: { [cobId: string]: boolean } = {};
  treatyLobCobs: { [lobId: string]: { [cobId: string]: boolean } } = {};

  // Confirm dialog control
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    // Preload MGA options for the filter dropdown
    this.service.getMgas(undefined, true).subscribe(res => {
      this.mgaOptions = res;
      this.cdr.markForCheck();
    });

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MasterTab;
      if (tab && ['treaties', 'mgas', 'lobs', 'cobs', 'states', 'reinsurers', 'risk-companies', 'gl-mappings'].includes(tab)) {
        this.currentTab = tab;
      } else {
        this.currentTab = 'treaties';
      }
      this.searchTerm = '';
      this.statusFilter = 'all';
      this.mgaFilter = 'all';
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
        this.reinsuranceService.getWorkbooks().subscribe({
          next: (wbs) => {
            this.seededProgramITD.clear();
            this.treatyWorkbookStatuses.clear();
            wbs.forEach(wb => {
              if (wb.source === 'ITD') {
                this.seededProgramITD.add(wb.program);
              }
              const existing = this.treatyWorkbookStatuses.get(wb.program);
              if (existing !== 'Approved') {
                this.treatyWorkbookStatuses.set(wb.program, wb.status || 'Pending');
              }
            });
            this.service.getTreaties(search, active).subscribe({
              next: (res) => { this.treaties = res; this.loading = false; this.cdr.markForCheck(); },
              error: () => { this.toast.error('Failed to load treaties'); this.loading = false; this.cdr.markForCheck(); }
            });
          },
          error: () => {
            this.service.getTreaties(search, active).subscribe({
              next: (res) => { this.treaties = res; this.loading = false; this.cdr.markForCheck(); },
              error: () => { this.toast.error('Failed to load treaties'); this.loading = false; this.cdr.markForCheck(); }
            });
          }
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
      case 'gl-mappings':
        this.loadGlMappings();
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
      case 'treaties': {
        let list = this.treaties;
        if (this.mgaFilter && this.mgaFilter !== 'all') {
          list = list.filter(t => t.mga_id === this.mgaFilter || (t.treaty_mgas && t.treaty_mgas.some(tm => tm.mga_id === this.mgaFilter)));
        }
        return list;
      }
      case 'mgas': return this.mgas;
      case 'lobs': return this.lobs;
      case 'cobs': return this.cobs;
      case 'states': return this.states;
      case 'reinsurers': return this.reinsurers;
      case 'risk-companies': return this.riskCompanies;
      case 'gl-mappings': return this.glMappings;
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
    this.simpleForm = {
      code: '',
      name: '',
      is_active: true,
      description: '',
      type: '',
      taxable: false,
      priority: 1,
      fully_earned: false
    };
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
      description: item.description || '',
      type: item.type || '',
      taxable: item.taxable || false,
      priority: item.priority || 1,
      fully_earned: item.fully_earned || false
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

    if (this.simpleMode === 'lob' || this.simpleMode === 'cob') {
      payload.description = this.simpleForm.description || null;
      payload.type = this.simpleMode === 'cob' ? (this.simpleForm.type || null) : null;
      payload.taxable = this.simpleForm.taxable || false;
      payload.priority = Number(this.simpleForm.priority || 1);
      payload.fully_earned = this.simpleForm.fully_earned || false;
    }

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
    this.loadTreatyOptions();
    this.mgaForm = {
      mga_code: '',
      name: '',
      tax_payable_inhouse: false,
      ledger_amount: 0,
      is_active: true,
      company_id: null,
      id_name: '',
      address: '',
      zip: '',
      city: '',
      state: '',
      phone: '',
      open_item: false,
      op_start_date: '',
      other_names: []
    };
    this.showMgaModal = true;
  }

  openMgaEdit(mga: MgaMaster): void {
    this.isEditMode = true;
    this.mgaModalTitle = `Edit MGA: ${mga.name}`;
    this.loadTreatyOptions();
    this.mgaForm = {
      id: mga.id,
      mga_code: mga.mga_code,
      name: mga.name,
      tax_payable_inhouse: mga.tax_payable_inhouse,
      ledger_amount: mga.ledger_amount || 0,
      is_active: mga.is_active,
      company_id: mga.company_id ? Number(mga.company_id) : null,
      id_name: mga.id_name || '',
      address: mga.address || '',
      zip: mga.zip || '',
      city: mga.city || '',
      state: mga.state || '',
      phone: mga.phone || '',
      open_item: mga.open_item || false,
      op_start_date: mga.op_start_date ? mga.op_start_date.substring(0, 10) : '',
      other_names: mga.other_names ? JSON.parse(JSON.stringify(mga.other_names)) : []
    };
    this.showMgaModal = true;
  }

  addOtherNameRow(): void {
    if (!this.mgaForm.other_names) {
      this.mgaForm.other_names = [];
    }
    this.mgaForm.other_names.push({ state: '', displayName: '' });
    this.cdr.markForCheck();
  }

  removeOtherNameRow(index: number): void {
    if (this.mgaForm.other_names) {
      this.mgaForm.other_names.splice(index, 1);
    }
    this.cdr.markForCheck();
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
      company_id: this.mgaForm.company_id ? Number(this.mgaForm.company_id) : null,
      other_names: this.mgaForm.other_names && this.mgaForm.other_names.length > 0 ? this.mgaForm.other_names : null
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
      address: '',
      zip: '',
      city: '',
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
      address: rc.address || '',
      zip: rc.zip || '',
      city: rc.city || '',
      notes: rc.notes || '',
      is_active: rc.is_active,
    };
    this.showRiskCompanyModal = true;
  }

  submitRiskCompany(): void {
    if (!this.riskCompanyForm.risk_company_id) {
      this.riskCompanyForm.risk_company_id = this.riskCompanyForm.company_id ? 'RC-' + this.riskCompanyForm.company_id : 'RC-' + Date.now();
    }
    if (!this.riskCompanyForm.name) {
      this.toast.error('Name is required');
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
      address: this.riskCompanyForm.address || null,
      zip: this.riskCompanyForm.zip || null,
      city: this.riskCompanyForm.city || null,
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

  openTreatyAdd(mgaId?: string): void {
    this.isEditMode = false;
    this.treatyModalTitle = 'Create Treaty';
    this.loadTreatyOptions();

    this.treatyForm = {
      treaty_code: '',
      name: '',
      mga_id: mgaId || '',
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
      carriers: [],
      reinsurers: [],
    };

    this.treatySelectedStates = {};
    this.treatySelectedMgas = {};
    if (mgaId) {
      this.treatySelectedMgas[mgaId] = true;
    }
    this.treatySelectedLobs = {};
    this.treatySelectedCobs = {};
    this.treatyLobCobs = {};
    this.showTreatyModal = true;
  }

  openTreatyEdit(treaty: Treaty): void {
    this.isEditMode = true;
    this.treatyModalTitle = `Edit Treaty: ${treaty.treaty_code}`;
    this.loadTreatyOptions();

    let carriers: any[] = [];
    if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
      carriers = treaty.treaty_carriers.map(tc => ({
        risk_company_id: tc.risk_company_id,
        retention_pct: tc.retention_pct
      }));
    } else if (treaty.risk_company_id) {
      carriers = [{ risk_company_id: treaty.risk_company_id, retention_pct: treaty.carrier_retention_pct ?? 100 }];
    }

    let reinsurers: any[] = [];
    if (treaty.treaty_reinsurers && treaty.treaty_reinsurers.length > 0) {
      reinsurers = treaty.treaty_reinsurers.map(tr => ({
        reinsurer_id: tr.reinsurer_id,
        cession_pct: tr.cession_pct
      }));
    } else if (treaty.reinsurer_id) {
      reinsurers = [{ reinsurer_id: treaty.reinsurer_id, cession_pct: treaty.reinsurer_cession_pct ?? 100 }];
    }

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
      carriers,
      reinsurers
    };

    // Prepopulate selections
    this.treatySelectedStates = {};
    if (treaty.treaty_states) {
      treaty.treaty_states.forEach(ts => {
        this.treatySelectedStates[ts.state_id] = true;
      });
    }

    this.treatySelectedMgas = {};
    if (treaty.treaty_mgas && treaty.treaty_mgas.length > 0) {
      treaty.treaty_mgas.forEach(tm => {
        this.treatySelectedMgas[tm.mga_id] = true;
      });
    } else if (treaty.mga_id) {
      this.treatySelectedMgas[treaty.mga_id] = true;
    }

    this.treatySelectedLobs = {};
    this.treatySelectedCobs = {};
    this.treatyLobCobs = {};
    if (treaty.treaty_lobs) {
      treaty.treaty_lobs.forEach(tl => {
        this.treatySelectedLobs[tl.lob_id] = true;
        this.treatyLobCobs[tl.lob_id] = {};
        if (tl.treaty_lob_cobs) {
          tl.treaty_lob_cobs.forEach(tlc => {
            this.treatyLobCobs[tl.lob_id][tlc.cob_id] = true;
            this.treatySelectedCobs[tlc.cob_id] = true;
          });
        }
      });
    }

    this.showTreatyModal = true;
  }

  submitTreaty(): void {
    if (!this.treatyForm.treaty_code || !this.treatyForm.name || !this.treatyForm.mga_id) {
      this.toast.error('Treaty Code, Name and MGA Underwriter are required');
      return;
    }
    this.submitting = true;
    const mga_ids = [this.treatyForm.mga_id];

    // Build state_ids
    const state_ids = Object.keys(this.treatySelectedStates).filter(k => this.treatySelectedStates[k]);

    // Build lobs structure
    const selectedLobIds = Object.keys(this.treatySelectedLobs).filter(lobId => this.treatySelectedLobs[lobId]);
    const selectedCobIds = Object.keys(this.treatySelectedCobs).filter(cobId => this.treatySelectedCobs[cobId]);

    const lobs = selectedLobIds.map(lobId => {
      return {
        lob_id: lobId,
        cob_ids: selectedCobIds,
      };
    });

    const carriers = (this.treatyForm.carriers || []).filter(c => c.risk_company_id);
    const reinsurers = (this.treatyForm.reinsurers || []).filter(r => r.reinsurer_id);

    const payload = {
      ...this.treatyForm,
      mga_id: mga_ids[0],
      mga_ids,
      effective_date: this.treatyForm.effective_date || null,
      expiration_date: this.treatyForm.expiration_date || null,
      state_ids,
      lobs,
      carriers,
      reinsurers
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

  addCarrierRow(): void {
    if (!this.treatyForm.carriers) {
      this.treatyForm.carriers = [];
    }
    this.treatyForm.carriers.push({
      risk_company_id: '',
      retention_pct: 100
    });
    this.cdr.markForCheck();
  }

  removeCarrierRow(index: number): void {
    if (this.treatyForm.carriers) {
      this.treatyForm.carriers.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  addReinsurerRow(): void {
    if (!this.treatyForm.reinsurers) {
      this.treatyForm.reinsurers = [];
    }
    this.treatyForm.reinsurers.push({
      reinsurer_id: '',
      cession_pct: 0
    });
    this.cdr.markForCheck();
  }

  removeReinsurerRow(index: number): void {
    if (this.treatyForm.reinsurers) {
      this.treatyForm.reinsurers.splice(index, 1);
    }
    this.cdr.markForCheck();
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

  getMgasListDisplay(treaty: Treaty): string {
    if (treaty.treaty_mgas && treaty.treaty_mgas.length > 0) {
      return treaty.treaty_mgas.map(m => m.mga?.name).filter(Boolean).join(', ');
    }
    return treaty.mga?.name || '-';
  }

  getCarriersListDisplay(treaty: Treaty): string {
    if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
      return treaty.treaty_carriers.map(tc => `${tc.risk_company?.name || 'Unknown'} (${tc.retention_pct}%)`).join(', ');
    }
    if (treaty.risk_company) {
      return `${treaty.risk_company.name} (${treaty.carrier_retention_pct ?? 100}%)`;
    }
    return '-';
  }

  getStatesListDisplay(states?: TreatyState[]): string {
    if (!states || states.length === 0) return '-';
    const codes = states.map(s => s.state?.state_code).filter(Boolean);
    if (codes.length === 0) return '-';
    if (codes.length > 5) {
      return codes.slice(0, 4).join(', ') + ` (+${codes.length - 4} more)`;
    }
    return codes.join(', ');
  }

  getFullStatesList(states?: TreatyState[]): string {
    if (!states || states.length === 0) return '';
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
          this.getMgasListDisplay(t),
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
        headers = ['Company', 'ID Name', 'Name', 'Phone', 'Admitted', 'State', 'Address 1', 'Zip', 'City', 'Status'];
        rows = this.riskCompanies.map(r => [
          r.company_id,
          r.id_name || '-',
          r.name,
          r.phone || '-',
          r.is_admitted ? 'Yes' : 'No',
          r.state || '-',
          r.address || '-',
          r.zip || '-',
          r.city || '-',
          r.is_active ? 'Active' : 'Inactive'
        ]);
        filename = 'risk_companies.csv';
        break;

      case 'lobs':
        headers = ['LOB Code', 'LOB Name', 'LOB Type', 'Taxable', 'Priority', 'Fully Earned', 'Status', 'Description'];
        rows = this.lobs.map(l => [
          l.lob_code,
          l.name,
          l.type || '-',
          l.taxable ? 'Yes' : 'No',
          l.priority,
          l.fully_earned ? 'Yes' : 'No',
          l.is_active ? 'Active' : 'Inactive',
          l.description || '-'
        ]);
        filename = 'lobs.csv';
        break;

      case 'cobs':
        headers = ['Class Code', 'Class Name', 'Class Type', 'Taxable', 'Priority', 'Fully Earned', 'Status', 'Description'];
        rows = this.cobs.map(c => [
          c.cob_code,
          c.name,
          c.type || '-',
          c.taxable ? 'Yes' : 'No',
          c.priority,
          c.fully_earned ? 'Yes' : 'No',
          c.is_active ? 'Active' : 'Inactive',
          c.description || '-'
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

      case 'gl-mappings':
        headers = ['GL Number', 'Type'];
        rows = this.glMappings.map(m => [
          this.getGLNumberDisplay(m),
          m.type
        ]);
        filename = 'gl_mappings.csv';
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

  // ==========================================
  // GL MAPPINGS ACTIONS
  // ==========================================
  loadGlMappings(): void {
    this.glMappingsService.getMappings().subscribe({
      next: (data) => {
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          this.glMappings = data.filter((m) => {
            const typeMatch = m.type.toLowerCase().includes(term);
            const code = m.coa?.account_code?.toString() || '';
            const desc = m.coa?.description?.toLowerCase() || '';
            return typeMatch || code.includes(term) || desc.includes(term);
          });
        } else {
          this.glMappings = data;
        }
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

  loadCoaOptions(): void {
    this.coaService.getAccounts(undefined, true).subscribe({
      next: (data) => {
        this.coaOptions = data.filter((coa) => !coa.is_parent);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Chart of Accounts options');
      },
    });
  }

  openGlMappingAdd(): void {
    this.isEditMode = false;
    this.glMappingModalTitle = 'Add GL Mapping';
    this.glMappingForm = {
      coa_id: '',
      type: '',
    };
    this.loadCoaOptions();
    this.showGlMappingModal = true;
    this.cdr.markForCheck();
  }

  openGlMappingEdit(mapping: GlMapping): void {
    this.isEditMode = true;
    this.glMappingModalTitle = 'Edit GL Mapping';
    this.glMappingForm = {
      id: mapping.id,
      coa_id: mapping.coa_id,
      type: mapping.type,
    };
    this.loadCoaOptions();
    this.showGlMappingModal = true;
    this.cdr.markForCheck();
  }

  submitGlMapping(): void {
    if (!this.glMappingForm.coa_id || !this.glMappingForm.type) {
      this.toast.error('Both Chart of Account and Mapping Type are required');
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      coa_id: this.glMappingForm.coa_id,
      type: this.glMappingForm.type,
    };

    if (this.isEditMode && this.glMappingForm.id) {
      this.glMappingsService.updateMapping(this.glMappingForm.id, payload).subscribe({
        next: () => {
          this.toast.success('GL Mapping updated successfully');
          this.showGlMappingModal = false;
          this.submitting = false;
          this.loadGlMappings();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to update GL mapping';
          this.toast.error(msg);
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.glMappingsService.createMapping(payload).subscribe({
        next: () => {
          this.toast.success('GL Mapping created successfully');
          this.showGlMappingModal = false;
          this.submitting = false;
          this.loadGlMappings();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to create GL mapping';
          this.toast.error(msg);
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  deleteGlMapping(mapping: GlMapping): void {
    this.confirmOpen = true;
    this.pendingAction = () => {
      this.glMappingsService.deleteMapping(mapping.id).subscribe({
        next: () => {
          this.toast.success('GL Mapping deleted successfully');
          this.loadGlMappings();
        },
        error: () => {
          this.toast.error('Failed to delete GL mapping');
        },
      });
    };
    this.cdr.markForCheck();
  }

  hasITDSeeded(programName: string): boolean {
    return this.seededProgramITD.has(programName);
  }

  getTreatyStatus(programName: string): string {
    return this.treatyWorkbookStatuses.get(programName) || '-';
  }

  getGLNumberDisplay(mapping: GlMapping): string {
    if (!mapping.coa) return '-';
    return `${mapping.coa.account_code} - ${mapping.coa.description}`;
  }

  selectedTreatyForUpload: any = null;

  triggerTreatyMonthlyUpload(treaty: any, inputEl: HTMLInputElement): void {
    this.selectedTreatyForUpload = treaty;
    inputEl.click();
  }

  triggerTreatyITDUpload(treaty: any, inputEl: HTMLInputElement): void {
    this.selectedTreatyForUpload = treaty;
    inputEl.click();
  }

  onTreatyMonthlyUpload(event: any): void {
    if (event.target.files && event.target.files.length > 0 && this.selectedTreatyForUpload) {
      const file = event.target.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading monthly exhibit for treaty: ${programName}...`);

      this.reinsuranceService.uploadWorkbook(file, false, programName).subscribe({
        next: () => {
          this.toast.success(`Successfully uploaded monthly exhibit for ${programName}.`);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
          this.loadData();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to upload monthly exhibit';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
        }
      });
    }
  }

  onTreatyITDUpload(event: any): void {
    if (event.target.files && event.target.files.length > 0 && this.selectedTreatyForUpload) {
      const file = event.target.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading and seeding ITD baseline for treaty: ${programName}...`);

      this.reinsuranceService.uploadWorkbook(file, true, programName).subscribe({
        next: () => {
          this.toast.success(`ITD baseline reserves uploaded and seeded for ${programName} successfully.`);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
          this.loadData();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to seed ITD baseline';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
        }
      });
    }
  }
  openAddItdModal(treaty: any): void {
    this.selectedTreatyForItd = treaty;
    this.itdForm.program = treaty.name;
    this.itdSelectedMonth = '12';
    this.itdSelectedYear = '2025';
    this.itdForm.month_key = '2025-12';
    this.itdForm.month_label = 'December 2025';

    const states = (treaty.treaty_states || []).map((s: any) => {
      const code = s.state?.state_code || s.state_code;
      const abbr = s.state?.state_abbr || s.state_code;
      return { code: String(code), label: String(abbr) };
    }).filter((s: any) => s.code);

    this.itdStatesList = [
      { code: 'TOTAL', label: 'TOTAL' },
      ...states.filter((s: any) => s.code !== 'TOTAL').sort((a: any, b: any) => a.label.localeCompare(b.label))
    ];
    this.itdSelectedStateCode = 'TOTAL';

    this.itdForm.exhibits = {};
    for (const st of this.itdStatesList) {
      this.itdForm.exhibits[st.code] = {
        uep: 0,
        loss_ibnr: 0,
        lae_ibnr_dcc: 0,
        lae_ibnr_aoe: 0,
        ulae_ibnr: 0
      };
    }

    // Load existing ITD baseline workbook if it exists
    this.reinsuranceService.getWorkbooks().subscribe({
      next: (wbs) => {
        const itdWb = wbs.find(w => 
          w.program?.trim().toLowerCase() === treaty.name?.trim().toLowerCase() && 
          w.source === 'ITD'
        );
        if (itdWb) {
          const mKey = itdWb.month_key || itdWb.monthKey || '2025-12';
          this.itdForm.month_key = mKey;
          this.itdForm.month_label = itdWb.month_label || itdWb.monthLabel || 'December 2025';
          const parts = mKey.split('-');
          if (parts.length === 2) {
            this.itdSelectedYear = parts[0];
            this.itdSelectedMonth = parts[1];
          }

          this.reinsuranceService.getWorkbook(itdWb.id).subscribe({
            next: (wbDetail) => {
              const exhibits = wbDetail?.state_exhibits || wbDetail?.stateExhibits;
              if (wbDetail && exhibits) {
                for (const ex of exhibits) {
                  const stateCode = ex.state_code || ex.stateCode;
                  const matchedStateObj = this.itdStatesList.find(s => String(s.code) === String(stateCode));
                  const targetState = matchedStateObj ? matchedStateObj.code : 
                                      (String(stateCode) === '5' ? 'CA' : null) || 
                                      (String(stateCode) === 'CA' ? '5' : null);
                  
                  if (targetState && this.itdForm.exhibits[targetState]) {
                    const val = (arr: any) => {
                      if (!arr) return 0;
                      if (Array.isArray(arr)) {
                        return arr.length > 1 ? Number(arr[1] ?? 0) : Number(arr[0] ?? 0);
                      }
                      return Number(arr);
                    };

                    this.itdForm.exhibits[targetState] = {
                      uep: val(ex.uep),
                      loss_ibnr: val(ex.loss_ibnr),
                      lae_ibnr_dcc: val(ex.lae_ibnr_dcc),
                      lae_ibnr_aoe: val(ex.lae_ibnr_aoe),
                      ulae_ibnr: val(ex.ulae_ibnr)
                    };
                  }
                }
                this.cdr.markForCheck();
              }
            }
          });
        }
      }
    });

    this.showItdModal = true;
    this.cdr.markForCheck();
  }

  saveManualITD(): void {
    if (!this.selectedTreatyForItd) return;

    const exhibitsArray = Object.keys(this.itdForm.exhibits).map(code => {
      const ex = this.itdForm.exhibits[code];
      return {
        state_code: code,
        pw: [0, 0, 0],
        uep: [0, Number(ex.uep || 0), Number(ex.uep || 0)],
        lp: [0, 0, 0],
        laep: [0, 0, 0],
        ae_paid: [0, 0, 0],
        loss_reserves: [0, 0, 0],
        loss_ibnr: [0, Number(ex.loss_ibnr || 0), Number(ex.loss_ibnr || 0)],
        lae_reserves_dcc: [0, 0, 0],
        lae_ibnr_dcc: [0, Number(ex.lae_ibnr_dcc || 0), Number(ex.lae_ibnr_dcc || 0)],
        lae_reserves_aoe: [0, 0, 0],
        lae_ibnr_aoe: [0, Number(ex.lae_ibnr_aoe || 0), Number(ex.lae_ibnr_aoe || 0)],
        ulae_ibnr: [0, Number(ex.ulae_ibnr || 0), Number(ex.ulae_ibnr || 0)]
      };
    });

    const payload = {
      program: this.itdForm.program,
      monthKey: this.itdForm.month_key,
      monthLabel: this.itdForm.month_label,
      exhibits: exhibitsArray
    };

    this.reinsuranceService.createManualITD(payload).subscribe({
      next: () => {
        this.toast.success(`Successfully saved manual ITD baseline for ${payload.program}`);
        this.showItdModal = false;
        this.selectedTreatyForItd = null;
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to save manual ITD baseline');
      }
    });
  }
}
