import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { AgGridConfigService } from '../../core/services/ag-grid-config.service';
import { MastersGrid } from './components/masters-grid/masters-grid';
import { NotesModal } from './components/notes-modal/notes-modal';
import { DocumentDrawer, DrawerDocument } from './components/document-drawer/document-drawer';
import {
  ActionButtonConfig,
  ActionButtonsCell,
} from '../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { MastersApi } from './services/masters-api';
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
  TreatyCarrier,
  TreatyReinsurer,
  DocumentType,
  SequencePrefixCounter,
  SimpleMasterRecord,
} from './models/master.model';

type DocumentableMaster =
  | (MgaMaster & { documents: MgaDocument[] })
  | (StateMaster & { documents: StateDocument[] })
  | (RiskCompany & { documents: RiskCompanyDocument[] });

type MasterDocument = MgaDocument | StateDocument | RiskCompanyDocument;

type HttpErrorLike = { error?: { message?: string } };

interface ItdExhibit {
  uep: number;
  loss_reserves: number;
  loss_ibnr: number;
  lae_reserves_dcc: number;
  lae_ibnr_dcc: number;
  lae_reserves_aoe: number;
  lae_ibnr_aoe: number;
  ulae_ibnr: number;
}

interface ItdRates {
  qs: number;
  cf: number;
  comm: number;
  ulae: number;
  boards_charge: number;
  loss_ratio_cap: number;
  loss_pick: number;
  lae_dcc: number;
  lae_aoe: number;
}

interface ItdForm {
  program: string;
  month_key: string;
  month_label: string;
  rates: ItdRates;
  exhibits: Record<string, ItdExhibit>;
}

interface ItdStateOption {
  code: string;
  label: string;
}

interface LockedPeriod {
  period: string;
  isLocked: boolean;
  user?: { name?: string };
  lockedAt?: string;
}

type SimpleEditableItem =
  | LineOfBusiness
  | CobMaster
  | ReinsurerCompany
  | SimpleMasterRecord
  | DocumentType
  | SequencePrefixCounter;

type MasterListItem =
  | Treaty
  | MgaMaster
  | LineOfBusiness
  | CobMaster
  | StateMaster
  | ReinsurerCompany
  | RiskCompany
  | GlMapping
  | SimpleMasterRecord
  | DocumentType
  | SequencePrefixCounter;
import { GlMappingsApi } from './services/gl-mappings-api';
import { ChartOfAccountsApi } from '../chart-of-accounts/services/chart-of-accounts-api';
import { GlMapping } from './models/gl-mapping.model';
import { ChartOfAccount } from '../../core/models/chart-of-account.model';
import { ReinsuranceApi } from '../reinsurance-calculations/services/reinsurance-api';

type MasterTab =
  | 'treaties'
  | 'mgas'
  | 'lobs'
  | 'cobs'
  | 'states'
  | 'reinsurers'
  | 'risk-companies'
  | 'gl-mappings'
  | 'brokers'
  | 'products'
  | 'locked-periods'
  | 'document-types'
  | 'sequence-prefix-counters';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    DropdownSearchComponent,
    MastersGrid,
    NotesModal,
    DocumentDrawer,
  ],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  // Label formatters for searchable dropdowns
  mgaLabelFn = (item: MgaMaster) => (item ? `${item.name} (${item.mga_code})` : '');
  riskCompanyLabelFn = (item: RiskCompany) =>
    item ? `${item.name} (${item.risk_company_id})` : '';
  reinsurerLabelFn = (item: ReinsurerCompany) =>
    item ? `${item.name} (${item.reinsurer_company_id})` : '';
  stateLabelFn = (item: StateMaster) => (item ? `${item.state_code} - ${item.name}` : '');
  stateAbbrLabelFn = (item: StateMaster) => (item ? `${item.state_abbr} - ${item.name}` : '');
  lobLabelFn = (item: LineOfBusiness) => (item ? `${item.name} (${item.lob_code})` : '');
  cobLabelFn = (item: CobMaster) => (item ? `${item.name} (${item.cob_code})` : '');
  coaLabelFn = (item: ChartOfAccount) => (item ? `${item.account_code} - ${item.description}` : '');
  nameLabelFn = (item: { id: string; name: string }) => (item ? item.name : '');

  simpleFormTypeOptions = [
    { id: 'Property', name: 'Property' },
    { id: 'Liability', name: 'Liability' },
    { id: 'Automobile', name: 'Automobile' },
    { id: 'Workers Comp', name: 'Workers Comp' },
    { id: 'Other', name: 'Other' },
  ];

  glMappingTypeOptionsList = [
    { id: 'AR', name: 'AR' },
    { id: 'AP', name: 'AP' },
    { id: 'MGA', name: 'MGA' },
    { id: 'BRK', name: 'BRK' },
  ];
  private service = inject(MastersApi);
  private reinsuranceService = inject(ReinsuranceApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private glMappingsService = inject(GlMappingsApi);
  private coaService = inject(ChartOfAccountsApi);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  @ViewChild('monthlyExcelInput') monthlyExcelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('itdExcelInput') itdExcelInput!: ElementRef<HTMLInputElement>;

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
  itdWorkbookIds = new Map<string, number>();
  treatyWorkbookStatuses = new Map<string, string>();

  // Data lists
  treaties: Treaty[] = [];
  mgas: MgaMaster[] = [];
  lobs: LineOfBusiness[] = [];
  cobs: CobMaster[] = [];
  states: StateMaster[] = [];
  reinsurers: ReinsurerCompany[] = [];
  riskCompanies: RiskCompany[] = [];
  brokers: SimpleMasterRecord[] = [];
  products: SimpleMasterRecord[] = [];
  lockedPeriods: SimpleMasterRecord[] = [];
  documentTypes: DocumentType[] = [];
  sequencePrefixCounters: SequencePrefixCounter[] = [];

  // Pagination
  pageSize = 25;
  currentPage = 1;

  // Simple Modals (LOB, COB, Reinsurer, Broker, Product)
  showSimpleModal = false;
  simpleModalTitle = '';
  simpleMode:
    | 'lob'
    | 'cob'
    | 'reinsurer'
    | 'broker'
    | 'product'
    | 'document-type'
    | 'sequence-prefix-counter' = 'lob';
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
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    lob_id?: string;
    cob_id?: string;
    prefix?: string;
    next_value?: number;
    padding_width?: number;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    type: '',
    taxable: false,
    priority: 1,
    fully_earned: false,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    lob_id: '',
    cob_id: '',
    prefix: '',
    next_value: 1,
    padding_width: 4,
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
    naics_code?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
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
    other_names: [],
    naics_code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
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
  selectedItem: MgaMaster | StateMaster | RiskCompany | null = null;
  documentsList: MasterDocument[] = [];
  uploadingDoc = false;
  documentTypesOptions: DocumentType[] = [];
  selectedDocType = '';

  // Notes View Modal
  showNotesModal = false;
  notesModalTitle = '';
  notesModalText = '';

  // ITD Modal Control
  showItdModal = false;
  selectedTreatyForItd: Treaty | null = null;
  itdForm: ItdForm = {
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
      lae_aoe: 7,
    },
    exhibits: {},
  };
  itdSelectedStateCode = 'TOTAL';
  itdStatesList: ItdStateOption[] = [{ code: 'TOTAL', label: 'TOTAL' }];
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
    { value: '12', label: 'December' },
  ];
  yearsList = [
    '2020',
    '2021',
    '2022',
    '2023',
    '2024',
    '2025',
    '2026',
    '2027',
    '2028',
    '2029',
    '2030',
  ];

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
    carriers: TreatyCarrier[];
    reinsurers: TreatyReinsurer[];
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
  brokerOptions: SimpleMasterRecord[] = [];
  brokerLabelFn = (item: SimpleMasterRecord) => item.name ?? '';
  showLockPeriodModal = false;
  newPeriodToLock = '';

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
      if (
        tab &&
        [
          'treaties',
          'mgas',
          'lobs',
          'cobs',
          'states',
          'reinsurers',
          'risk-companies',
          'gl-mappings',
          'brokers',
          'products',
          'locked-periods',
          'document-types',
          'sequence-prefix-counters',
        ].includes(tab)
      ) {
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
      queryParamsHandling: 'merge',
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
          next: wbs => {
            this.seededProgramITD.clear();
            this.itdWorkbookIds.clear();
            this.treatyWorkbookStatuses.clear();
            wbs.forEach(wb => {
              if (wb.source === 'ITD' && wb.program) {
                this.seededProgramITD.add(wb.program);
                this.itdWorkbookIds.set(wb.program, wb.id);
              }
              const progName = (wb.program ?? '').trim();
              const existing = this.treatyWorkbookStatuses.get(progName);
              if (existing !== 'Approved') {
                this.treatyWorkbookStatuses.set(progName, (wb.status as string) || 'Pending');
              }
            });
            this.service.getTreaties(search, active).subscribe({
              next: res => {
                this.treaties = res;
                this.loading = false;
                this.cdr.markForCheck();
              },
              error: () => {
                this.toast.error('Failed to load treaties');
                this.loading = false;
                this.cdr.markForCheck();
              },
            });
          },
          error: () => {
            this.service.getTreaties(search, active).subscribe({
              next: res => {
                this.treaties = res;
                this.loading = false;
                this.cdr.markForCheck();
              },
              error: () => {
                this.toast.error('Failed to load treaties');
                this.loading = false;
                this.cdr.markForCheck();
              },
            });
          },
        });
        break;
      case 'mgas':
        this.service.getMgas(search, active).subscribe({
          next: res => {
            this.mgas = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load MGAs');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'lobs':
        this.service.getLobs(search, active).subscribe({
          next: res => {
            this.lobs = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load LOBs');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'cobs':
        this.service.getCobs(search, active).subscribe({
          next: res => {
            this.cobs = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load COBs');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'states':
        this.service.getStates(search, active).subscribe({
          next: res => {
            this.states = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load States');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'reinsurers':
        this.service.getReinsurers(search, active).subscribe({
          next: res => {
            this.reinsurers = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Reinsurers');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'risk-companies':
        this.service.getRiskCompanies(search, active).subscribe({
          next: res => {
            this.riskCompanies = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Risk Companies');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'gl-mappings':
        this.loadGlMappings();
        break;
      case 'brokers':
        this.service.getBrokers(search, active).subscribe({
          next: res => {
            this.brokers = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Brokers');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'products':
        this.service.getProducts(search, active).subscribe({
          next: res => {
            this.products = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Products');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'locked-periods':
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
        break;
      case 'document-types':
        this.service.getDocumentTypes(search, active).subscribe({
          next: res => {
            this.documentTypes = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Document Types');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'sequence-prefix-counters':
        this.service.getSequencePrefixCounters(search, active).subscribe({
          next: res => {
            this.sequencePrefixCounters = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Sequence Prefix & Counters');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  // Pagination client-side helpers
  get paginatedItems(): MasterListItem[] {
    const list = this.currentList;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get currentList(): MasterListItem[] {
    switch (this.currentTab) {
      case 'treaties': {
        let list = this.treaties;
        if (this.mgaFilter && this.mgaFilter !== 'all') {
          list = list.filter(
            t =>
              t.mga_id === this.mgaFilter ||
              t.treaty_mgas?.some(tm => tm.mga_id === this.mgaFilter),
          );
        }
        return list;
      }
      case 'mgas':
        return this.mgas;
      case 'lobs':
        return this.lobs;
      case 'cobs':
        return this.cobs;
      case 'states':
        return this.states;
      case 'reinsurers':
        return this.reinsurers;
      case 'risk-companies':
        return this.riskCompanies;
      case 'gl-mappings':
        return this.glMappings;
      case 'brokers':
        return this.brokers;
      case 'products':
        return this.products;
      case 'locked-periods':
        return this.lockedPeriods;
      case 'document-types':
        return this.documentTypes;
      case 'sequence-prefix-counters':
        return this.sequencePrefixCounters;
      default:
        return [];
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

  get currentColumnDefs(): ColDef[] {
    const statusCol: ColDef = {
      headerName: 'STATUS',
      field: 'is_active',
      flex: 1,
      minWidth: 100,
      maxWidth: 120,
      cellRenderer: StatusBadgeCell,
    };

    switch (this.currentTab) {
      case 'treaties':
        return [
          { headerName: 'CODE', field: 'treaty_code', flex: 1, minWidth: 100, maxWidth: 120 },
          { headerName: 'TREATY NAME', field: 'name', flex: 2, minWidth: 150 },
          {
            headerName: 'MGA',
            valueGetter: p => this.getMgasListDisplay(p.data),
            flex: 1.5,
            minWidth: 120,
          },
          {
            headerName: 'CARRIERS',
            valueGetter: p => this.getCarriersListDisplay(p.data),
            flex: 2,
            minWidth: 200,
          },
          {
            headerName: 'STATES',
            valueGetter: p => this.getStatesListDisplay(p.data?.treaty_states),
            flex: 1.5,
            minWidth: 120,
          },
          {
            headerName: 'LOBS (COBS)',
            valueGetter: p => this.getLobsListDisplay(p.data?.treaty_lobs),
            flex: 2,
            minWidth: 150,
          },
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: (data: Treaty) => {
                const btns: ActionButtonConfig[] = [];
                if (this.hasITDSeeded(data.name)) {
                  btns.push({ label: 'Upload Excel', action: 'uploadExcel' });
                }
                btns.push({ label: 'Upload ITD', action: 'uploadItd' });
                btns.push({ label: 'Manual ITD', action: 'manualItd' });
                btns.push({ label: 'Edit', action: 'edit' });
                btns.push({ label: 'Delete', action: 'delete', danger: true });
                return btns;
              },
              onClick: (action: string, data: Treaty) => {
                if (action === 'uploadExcel') this.triggerTreatyMonthlyUpload(data);
                if (action === 'uploadItd') this.triggerTreatyITDUpload(data);
                if (action === 'manualItd') this.openAddItdModal(data);
                if (action === 'edit') this.openTreatyEdit(data);
                if (action === 'delete') this.deleteTreaty(data);
              },
            },
            flex: 0,
            width: 220,
            minWidth: 220,
            maxWidth: 220,
            cellStyle: { justifyContent: 'flex-start' },
          },
        ];

      case 'mgas':
        return [
          { headerName: 'MGA CODE', field: 'mga_code', flex: 1, minWidth: 100, maxWidth: 120 },
          { headerName: 'MGA NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'NAICS CODE', field: 'naics_code', flex: 1.2, minWidth: 120 },
          {
            headerName: 'TAX PAYABLE IN-HOUSE',
            field: 'tax_payable_inhouse',
            cellRenderer: StatusBadgeCell,
            flex: 1.5,
            minWidth: 150,
          },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Add Treaties', action: 'addTreaty' },
                { label: 'Document', action: 'doc' },
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: MgaMaster) => {
                if (action === 'addTreaty') this.openTreatyAdd(data.id);
                if (action === 'doc') this.openDocModal('mga', data);
                if (action === 'edit') this.openMgaEdit(data);
                if (action === 'delete') this.deleteMga(data);
              },
            },
            flex: 0,
            width: 320,
            minWidth: 320,
            maxWidth: 320,
          },
        ];

      case 'states':
        return [
          { headerName: 'STATE CODE', field: 'state_code', flex: 1, minWidth: 100 },
          { headerName: 'STATE ABBR', field: 'state_abbr', flex: 1, minWidth: 100 },
          { headerName: 'STATE NAME', field: 'name', flex: 3, minWidth: 200 },
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Document', action: 'doc' },
                { label: 'Notes', action: 'notes' },
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: StateMaster) => {
                if (action === 'doc') this.openDocModal('state', data);
                if (action === 'notes')
                  this.openNotesModal('State Notes: ' + data.name, data.notes);
                if (action === 'edit') this.openStateEdit(data);
                if (action === 'delete') this.deleteState(data);
              },
            },
            flex: 0,
            width: 280,
            minWidth: 280,
            maxWidth: 280,
          },
        ];

      case 'risk-companies':
        return [
          {
            headerName: 'COMPANY',
            valueGetter: p =>
              `${p.data.company_id}${p.data.risk_company_id ? ` (${p.data.risk_company_id})` : ''}`,
            flex: 1.5,
            minWidth: 150,
          },
          { headerName: 'ID NAME', field: 'id_name', flex: 1.5, minWidth: 150 },
          { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
          { headerName: 'PHONE', field: 'phone', flex: 1.5, minWidth: 120 },
          {
            headerName: 'ADMITTED',
            field: 'is_admitted',
            cellRenderer: StatusBadgeCell,
            flex: 1,
            minWidth: 100,
          },
          { headerName: 'STATE', field: 'state', flex: 1, minWidth: 80 },
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Document', action: 'doc' },
                { label: 'Notes', action: 'notes' },
                { label: 'View Policy', action: 'policy' },
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: RiskCompany) => {
                if (action === 'doc') this.openDocModal('risk-company', data);
                if (action === 'notes')
                  this.openNotesModal('Risk Company Notes: ' + data.name, data.notes);
                if (action === 'policy') this.viewPolicy(data);
                if (action === 'edit') this.openRiskCompanyEdit(data);
                if (action === 'delete') this.deleteRiskCompany(data);
              },
            },
            flex: 0,
            width: 360,
            minWidth: 360,
            maxWidth: 360,
          },
        ];

      case 'gl-mappings':
        return [
          {
            headerName: 'GL NUMBER',
            valueGetter: p => this.getGLNumberDisplay(p.data),
            flex: 2,
            minWidth: 200,
          },
          {
            headerName: 'TYPE',
            field: 'type',
            cellRenderer: (p: ICellRendererParams<GlMapping, string>) =>
              `<span class="type-badge ${p.value?.toLowerCase()}">${p.value}</span>`,
            flex: 1,
            minWidth: 100,
          },
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: GlMapping) => {
                if (action === 'edit') this.openGlMappingEdit(data);
                if (action === 'delete') this.deleteGlMapping(data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'lobs':
        return [
          { headerName: 'LOB CODE', field: 'lob_code', flex: 1, minWidth: 100, maxWidth: 120 },
          {
            headerName: 'LOB NAME',
            valueGetter: p => p.data.name,
            cellRenderer: (p: ICellRendererParams<LineOfBusiness>) => {
              const desc = p.data?.description
                ? `<div style="font-size: 11px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${p.data.description}">${p.data.description}</div>`
                : '';
              return `<div style="line-height:1.2; margin-top:10px;"><div style="font-weight: 500;">${p.data?.name}</div>${desc}</div>`;
            },
            flex: 3,
            minWidth: 200,
          },
          {
            headerName: 'TAXABLE',
            field: 'taxable',
            cellRenderer: StatusBadgeCell,
            flex: 1,
            minWidth: 100,
          },
          { headerName: 'PRIORITY', field: 'priority', flex: 1, minWidth: 100 },
          {
            headerName: 'FULLY EARNED',
            field: 'fully_earned',
            cellRenderer: StatusBadgeCell,
            flex: 1,
            minWidth: 120,
          },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: LineOfBusiness) => {
                if (action === 'edit') this.openSimpleEdit('lob', data);
                if (action === 'delete') this.deleteSimple('lob', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'cobs':
        return [
          { headerName: 'CLASS CODE', field: 'cob_code', flex: 1, minWidth: 100, maxWidth: 120 },
          {
            headerName: 'CLASS NAME',
            valueGetter: p => p.data.name,
            cellRenderer: (p: ICellRendererParams<CobMaster>) => {
              const desc = p.data?.description
                ? `<div style="font-size: 11px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${p.data.description}">${p.data.description}</div>`
                : '';
              return `<div style="line-height:1.2; margin-top:10px;"><div style="font-weight: 500;">${p.data?.name}</div>${desc}</div>`;
            },
            flex: 3,
            minWidth: 200,
          },
          { headerName: 'CLASS TYPE', field: 'type', flex: 1.5, minWidth: 120 },
          {
            headerName: 'TAXABLE',
            field: 'taxable',
            cellRenderer: StatusBadgeCell,
            flex: 1,
            minWidth: 100,
          },
          { headerName: 'PRIORITY', field: 'priority', flex: 1, minWidth: 100 },
          {
            headerName: 'FULLY EARNED',
            field: 'fully_earned',
            cellRenderer: StatusBadgeCell,
            flex: 1,
            minWidth: 120,
          },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: CobMaster) => {
                if (action === 'edit') this.openSimpleEdit('cob', data);
                if (action === 'delete') this.deleteSimple('cob', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'reinsurers':
        return [
          {
            headerName: 'CODE ID',
            field: 'reinsurer_company_id',
            flex: 1.5,
            minWidth: 120,
            maxWidth: 180,
          },
          { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: ReinsurerCompany) => {
                if (action === 'edit') this.openSimpleEdit('reinsurer', data);
                if (action === 'delete') this.deleteSimple('reinsurer', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'brokers':
        return [
          { headerName: 'BROKER CODE', field: 'brokerCode', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'CONTACT NAME', field: 'contactName', flex: 1.5, minWidth: 120 },
          { headerName: 'EMAIL', field: 'contactEmail', flex: 2, minWidth: 150 },
          { headerName: 'PHONE', field: 'contactPhone', flex: 1.5, minWidth: 120 },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: SimpleMasterRecord) => {
                if (action === 'edit') this.openSimpleEdit('broker', data);
                if (action === 'delete') this.deleteSimple('broker', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'products':
        return [
          { headerName: 'PRODUCT ID', field: 'productId', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          {
            headerName: 'LOB',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
            valueGetter: p => p.data.lob?.name || '-',
            flex: 1.5,
            minWidth: 120,
          },
          {
            headerName: 'COB',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
            valueGetter: p => p.data.cob?.name || '-',
            flex: 1.5,
            minWidth: 120,
          },
          { headerName: 'DESCRIPTION', field: 'description', flex: 2.5, minWidth: 180 },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: SimpleMasterRecord) => {
                if (action === 'edit') this.openSimpleEdit('product', data);
                if (action === 'delete') this.deleteSimple('product', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'locked-periods':
        return [
          { headerName: 'PERIOD', field: 'period', flex: 1.5, minWidth: 120 },
          {
            headerName: 'STATUS',
            valueGetter: p => (p.data.isLocked ? 'Locked' : 'Open'),
            cellRenderer: (p: ICellRendererParams<LockedPeriod, string>) => {
              const color = p.value === 'Locked' ? '#e05470' : '#19a347';
              return `<span style="font-weight: 700; color: ${color};">${p.value}</span>`;
            },
            flex: 1,
            minWidth: 100,
          },
          {
            headerName: 'LOCKED BY',
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
            valueGetter: p => p.data.user?.name || '-',
            flex: 1.5,
            minWidth: 120,
          },
          {
            headerName: 'LOCKED AT',
            valueGetter: p => (p.data.lockedAt ? new Date(p.data.lockedAt).toLocaleString() : '-'),
            flex: 2,
            minWidth: 150,
          },
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: (data: LockedPeriod) => [
                {
                  label: data.isLocked ? 'Unlock' : 'Lock',
                  action: data.isLocked ? 'unlock' : 'lock',
                },
              ],
              onClick: (action: string, data: LockedPeriod) => {
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

      case 'document-types':
        return [
          { headerName: 'CODE', field: 'code', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'DESCRIPTION', field: 'description', flex: 3, minWidth: 200 },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: DocumentType) => {
                if (action === 'edit') this.openSimpleEdit('document-type', data);
                if (action === 'delete') this.deleteSimple('document-type', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      case 'sequence-prefix-counters':
        return [
          { headerName: 'CODE', field: 'code', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'PREFIX', field: 'prefix', flex: 1, minWidth: 100 },
          {
            headerName: 'NEXT VALUE',
            valueGetter: p =>
              p.data.next_value !== undefined ? p.data.next_value : p.data.nextValue,
            flex: 1,
            minWidth: 100,
          },
          {
            headerName: 'PADDING WIDTH',
            valueGetter: p =>
              p.data.padding_width !== undefined ? p.data.padding_width : p.data.paddingWidth,
            flex: 1,
            minWidth: 100,
          },
          { headerName: 'DESCRIPTION', field: 'description', flex: 2.5, minWidth: 180 },
          statusCol,
          {
            headerName: 'ACTIONS',
            cellRenderer: ActionButtonsCell,
            cellRendererParams: {
              buttons: [
                { label: 'Edit', action: 'edit' },
                { label: 'Delete', action: 'delete', danger: true },
              ],
              onClick: (action: string, data: SequencePrefixCounter) => {
                if (action === 'edit') this.openSimpleEdit('sequence-prefix-counter', data);
                if (action === 'delete') this.deleteSimple('sequence-prefix-counter', data);
              },
            },
            flex: 0,
            width: 160,
            minWidth: 160,
            maxWidth: 160,
          },
        ];

      default:
        return [];
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
      fully_earned: false,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      lob_id: '',
      cob_id: '',
      prefix: '',
      next_value: 1,
      padding_width: 4,
    };
    this.showSimpleModal = true;
  }

  openSimpleEdit(mode: typeof this.simpleMode, item: SimpleEditableItem): void {
    this.simpleMode = mode;
    this.isEditMode = true;
    this.simpleModalTitle = `Edit ${this.getMasterLabel(mode)}`;
    const rec = item as unknown as Record<string, unknown>;
    this.simpleForm = {
      id: rec['id'] as string,
      code:
        (rec['lob_code'] as string) ||
        (rec['cob_code'] as string) ||
        (rec['reinsurer_company_id'] as string) ||
        (rec['broker_code'] as string) ||
        (rec['product_id'] as string) ||
        (rec['code'] as string) ||
        '',
      name: rec['name'] as string,
      is_active: rec['is_active'] as boolean,
      description: (rec['description'] as string) || '',
      type: (rec['type'] as string) || '',
      taxable: (rec['taxable'] as boolean) || false,
      priority: (rec['priority'] as number) || 1,
      fully_earned: (rec['fully_earned'] as boolean) || false,
      contact_name: (rec['contact_name'] as string) || (rec['contactName'] as string) || '',
      contact_email: (rec['contact_email'] as string) || (rec['contactEmail'] as string) || '',
      contact_phone: (rec['contact_phone'] as string) || (rec['contactPhone'] as string) || '',
      lob_id: (rec['lob_id'] as string) || (rec['lobId'] as string) || '',
      cob_id: (rec['cob_id'] as string) || (rec['cobId'] as string) || '',
      prefix: (rec['prefix'] as string) || '',
      next_value:
        rec['next_value'] !== undefined
          ? (rec['next_value'] as number)
          : (rec['nextValue'] as number) || 1,
      padding_width:
        rec['padding_width'] !== undefined
          ? (rec['padding_width'] as number)
          : (rec['paddingWidth'] as number) || 4,
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
    const payload: Record<string, unknown> = {
      [codeKey]: this.simpleForm.code,
      name: this.simpleForm.name,
      is_active: this.simpleForm.is_active,
    };

    if (this.simpleMode === 'lob' || this.simpleMode === 'cob') {
      payload['description'] = this.simpleForm.description || null;
      payload['type'] = this.simpleMode === 'cob' ? this.simpleForm.type || null : null;
      payload['taxable'] = this.simpleForm.taxable || false;
      payload['priority'] = Number(this.simpleForm.priority || 1);
      payload['fully_earned'] = this.simpleForm.fully_earned || false;
    } else if (this.simpleMode === 'broker') {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_name'] = this.simpleForm.contact_name || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_email'] = this.simpleForm.contact_email || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_phone'] = this.simpleForm.contact_phone || null;
    } else if (this.simpleMode === 'product') {
      payload['description'] = this.simpleForm.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['lob_id'] = this.simpleForm.lob_id || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['cob_id'] = this.simpleForm.cob_id || null;
    } else if (this.simpleMode === 'sequence-prefix-counter') {
      payload['description'] = this.simpleForm.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['prefix'] = this.simpleForm.prefix || null;
      payload['next_value'] = Number(this.simpleForm.next_value ?? 1);
      payload['padding_width'] = Number(this.simpleForm.padding_width ?? 4);
    }

    let request!: Observable<unknown>;
    if (this.isEditMode) {
      if (!this.simpleForm.id) return;
      const id = this.simpleForm.id;
      switch (this.simpleMode) {
        case 'lob':
          request = this.service.updateLob(id, payload as Partial<LineOfBusiness>);
          break;
        case 'cob':
          request = this.service.updateCob(id, payload as Partial<CobMaster>);
          break;
        case 'reinsurer':
          request = this.service.updateReinsurer(id, payload as Partial<ReinsurerCompany>);
          break;
        case 'broker':
          request = this.service.updateBroker(id, payload as SimpleMasterRecord);
          break;
        case 'product':
          request = this.service.updateProduct(id, payload as SimpleMasterRecord);
          break;
        case 'document-type':
          request = this.service.updateDocumentType(id, payload as Partial<DocumentType>);
          break;
        case 'sequence-prefix-counter':
          request = this.service.updateSequencePrefixCounter(
            id,
            payload as Partial<SequencePrefixCounter>,
          );
          break;
      }
    } else {
      switch (this.simpleMode) {
        case 'lob':
          request = this.service.createLob(payload as Partial<LineOfBusiness>);
          break;
        case 'cob':
          request = this.service.createCob(payload as Partial<CobMaster>);
          break;
        case 'reinsurer':
          request = this.service.createReinsurer(payload as Partial<ReinsurerCompany>);
          break;
        case 'broker':
          request = this.service.createBroker(payload as SimpleMasterRecord);
          break;
        case 'product':
          request = this.service.createProduct(payload as SimpleMasterRecord);
          break;
        case 'document-type':
          request = this.service.createDocumentType(payload as Partial<DocumentType>);
          break;
        case 'sequence-prefix-counter':
          request = this.service.createSequencePrefixCounter(
            payload as Partial<SequencePrefixCounter>,
          );
          break;
      }
    }

    request.subscribe({
      next: () => {
        this.toast.success(`${this.getMasterLabel(this.simpleMode)} saved successfully`);
        this.showSimpleModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save master data');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteSimple(mode: typeof this.simpleMode, item: SimpleEditableItem): void {
    this.confirmTitle = `Delete ${this.getMasterLabel(mode)}`;
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      if (!item.id) return;
      const id = item.id;
      let request!: Observable<unknown>;
      switch (mode) {
        case 'lob':
          request = this.service.deleteLob(id);
          break;
        case 'cob':
          request = this.service.deleteCob(id);
          break;
        case 'reinsurer':
          request = this.service.deleteReinsurer(id);
          break;
        case 'broker':
          request = this.service.deleteBroker(id);
          break;
        case 'product':
          request = this.service.deleteProduct(id);
          break;
        case 'document-type':
          request = this.service.deleteDocumentType(id);
          break;
        case 'sequence-prefix-counter':
          request = this.service.deleteSequencePrefixCounter(id);
          break;
      }
      request.subscribe({
        next: () => {
          this.toast.success(`${this.getMasterLabel(mode)} deleted`);
          this.loadData();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete item');
        },
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
      other_names: [],
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
      ledger_amount: mga.ledger_amount ?? 0,
      is_active: mga.is_active,
      company_id: mga.company_id ? Number(mga.company_id) : null,
      id_name: mga.id_name ?? '',
      address: mga.address ?? '',
      zip: mga.zip ?? '',
      city: mga.city ?? '',
      state: mga.state ?? '',
      phone: mga.phone ?? '',
      open_item: mga.open_item ?? false,
      op_start_date: mga.op_start_date ? mga.op_start_date.substring(0, 10) : '',
      other_names: mga.other_names ? JSON.parse(JSON.stringify(mga.other_names)) : [],
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
      other_names:
        this.mgaForm.other_names && this.mgaForm.other_names.length > 0
          ? this.mgaForm.other_names
          : null,
    };

    if (this.isEditMode) {
      if (!this.mgaForm.id) return;
      this.service.updateMga(this.mgaForm.id, payload).subscribe({
        next: () => {
          this.toast.success('MGA updated successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.loadData();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to update MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.service.createMga(payload).subscribe({
        next: () => {
          this.toast.success('MGA created successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.loadData();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to create MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        },
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
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
          this.toast.error(err.error?.message || 'Failed to delete MGA');
        },
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // GENERIC DOCUMENTS DRAWER ACTIONS
  // ==========================================
  get documentDrawerSubtitle(): string {
    const item = this.selectedItem as unknown as Record<string, unknown> | null;
    if (!item) return '';
    const code = item['mga_code'] ?? item['state_abbr'] ?? item['risk_company_id'] ?? '';
    return `${code} - ${this.selectedItem?.name ?? ''}`;
  }

  openDocModal(
    mode: 'mga' | 'state' | 'risk-company',
    item: MgaMaster | StateMaster | RiskCompany,
  ): void {
    this.documentMode = mode;
    this.selectedItem = item;
    this.documentsList = [];
    this.selectedDocType = '';
    this.documentTypesOptions = [];
    this.showDocModal = true;

    this.service.getDocumentTypes(undefined, true).subscribe(res => {
      this.documentTypesOptions = res;
      this.cdr.markForCheck();
    });

    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;
    let request: Observable<DocumentableMaster>;
    if (this.documentMode === 'mga') {
      request = this.service.getMga(id);
    } else if (this.documentMode === 'state') {
      request = this.service.getState(id);
    } else {
      request = this.service.getRiskCompany(id);
    }

    request.subscribe({
      next: res => {
        this.documentsList = res.documents || [];
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
    let request: Observable<MasterDocument>;
    if (this.documentMode === 'mga') {
      request = this.service.uploadMgaDocument(this.selectedItem.id, file, documentType);
    } else if (this.documentMode === 'state') {
      request = this.service.uploadStateDocument(this.selectedItem.id, file, documentType);
    } else {
      request = this.service.uploadRiskCompanyDocument(this.selectedItem.id, file, documentType);
    }

    request.subscribe({
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
    let endpoint = '';
    if (this.documentMode === 'mga') {
      endpoint = 'mgas';
    } else if (this.documentMode === 'state') {
      endpoint = 'states';
    } else {
      endpoint = 'risk-companies';
    }
    window.open(
      `${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`,
      '_blank',
    );
  }

  deleteDoc(doc: DrawerDocument): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      let request: Observable<void>;
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
        error: (err: HttpErrorLike) => {
          this.toast.error(err.error?.message ?? 'Failed to delete document');
        },
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
      notes: state.notes ?? '',
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

    if (this.isEditMode && !this.stateForm.id) return;
    const request: Observable<StateMaster> = this.isEditMode
      ? this.service.updateState(this.stateForm.id as string, payload)
      : this.service.createState(payload);

    request.subscribe({
      next: () => {
        this.toast.success('State saved successfully');
        this.showStateModal = false;
        this.submitting = false;
        this.loadData();
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
      this.service.deleteState(state.id).subscribe({
        next: () => {
          this.toast.success('State deleted successfully');
          this.loadData();
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
      id_name: rc.id_name ?? '',
      name: rc.name,
      phone: rc.phone ?? '',
      is_admitted: rc.is_admitted,
      state: rc.state ?? '',
      address: rc.address ?? '',
      zip: rc.zip ?? '',
      city: rc.city ?? '',
      notes: rc.notes ?? '',
      is_active: rc.is_active,
    };
    this.showRiskCompanyModal = true;
  }

  submitRiskCompany(): void {
    if (!this.riskCompanyForm.risk_company_id) {
      this.riskCompanyForm.risk_company_id = this.riskCompanyForm.company_id
        ? 'RC-' + this.riskCompanyForm.company_id
        : 'RC-' + Date.now();
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

    if (this.isEditMode && !this.riskCompanyForm.id) return;
    const request: Observable<RiskCompany> = this.isEditMode
      ? this.service.updateRiskCompany(this.riskCompanyForm.id as string, payload)
      : this.service.createRiskCompany(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Risk Company saved successfully');
        this.showRiskCompanyModal = false;
        this.submitting = false;
        this.loadData();
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
      this.service.deleteRiskCompany(rc.id).subscribe({
        next: () => {
          this.toast.success('Risk Company deleted successfully');
          this.loadData();
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

  // ==========================================
  // NOTES VIEW MODAL ACTIONS
  // ==========================================
  openNotesModal(title: string, text: string | null | undefined): void {
    this.notesModalTitle = title;
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also show the default "no notes" text
    this.notesModalText = text || 'No notes available.';
    this.showNotesModal = true;
  }

  // ==========================================
  // TREATY MASTER ACTIONS
  // ==========================================
  loadTreatyOptions(): void {
    this.service.getMgas(undefined, true).subscribe(res => {
      this.mgaOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getReinsurers(undefined, true).subscribe(res => {
      this.reinsurerOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getRiskCompanies(undefined, true).subscribe(res => {
      this.riskCompanyOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getLobs(undefined, true).subscribe(res => {
      this.lobOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getCobs(undefined, true).subscribe(res => {
      this.cobOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getStates(undefined, true).subscribe(res => {
      this.stateOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getBrokers(undefined, true).subscribe(res => {
      this.brokerOptions = res;
      this.cdr.markForCheck();
    });
  }

  openTreatyAdd(mgaId?: string): void {
    this.isEditMode = false;
    this.treatyModalTitle = 'Create Treaty';
    this.loadTreatyOptions();

    this.treatyForm = {
      treaty_code: '',
      name: '',
      mga_id: mgaId ?? '',
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
      lae_dcc_pct: 0,
      lae_aoe_pct: 0,
      carrier_retention_pct: 100,
      reinsurer_cession_pct: 0,
      is_active: true,
      state_ids: [],
      lobs: [],
      carriers: [{ risk_company_id: '', retention_pct: 100 }],
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

    let carriers: TreatyCarrier[] = [];
    if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
      carriers = [
        {
          risk_company_id: treaty.treaty_carriers[0].risk_company_id,
          retention_pct: treaty.treaty_carriers[0].retention_pct,
        },
      ];
    } else if (treaty.risk_company_id) {
      carriers = [
        {
          risk_company_id: treaty.risk_company_id,
          retention_pct: treaty.carrier_retention_pct ?? 100,
        },
      ];
    } else {
      carriers = [
        {
          risk_company_id: '',
          retention_pct: 100,
        },
      ];
    }

    let reinsurers: TreatyReinsurer[] = [];
    if (treaty.treaty_reinsurers && treaty.treaty_reinsurers.length > 0) {
      reinsurers = treaty.treaty_reinsurers.map(tr => ({
        reinsurer_id: tr.reinsurer_id,
        cession_pct: tr.cession_pct,
      }));
    } else if (treaty.reinsurer_id) {
      reinsurers = [
        { reinsurer_id: treaty.reinsurer_id, cession_pct: treaty.reinsurer_cession_pct ?? 100 },
      ];
    }

    this.treatyForm = {
      id: treaty.id,
      treaty_code: treaty.treaty_code,
      name: treaty.name,
      mga_id: treaty.mga_id,
      reinsurer_id: treaty.reinsurer_id,
      risk_company_id: treaty.risk_company_id,
      effective_date: treaty.effective_date
        ? new Date(treaty.effective_date).toISOString().slice(0, 10)
        : '',
      expiration_date: treaty.expiration_date
        ? new Date(treaty.expiration_date).toISOString().slice(0, 10)
        : '',
      qs_pct: treaty.qs_pct,
      cf_pct: treaty.cf_pct,
      comm_pct: treaty.comm_pct,
      bb_pct: treaty.bb_pct,
      ulae_pct: treaty.ulae_pct,
      xol_pct: treaty.xol_pct,
      lr_cap_pct: treaty.lr_cap_pct,
      ibnr_pct: treaty.ibnr_pct,
      lae_dcc_pct: treaty.lae_dcc_pct,
      lae_aoe_pct: treaty.lae_aoe_pct,
      carrier_retention_pct: treaty.carrier_retention_pct,
      reinsurer_cession_pct: treaty.reinsurer_cession_pct,
      is_active: treaty.is_active,
      state_ids: [],
      lobs: [],
      carriers,
      reinsurers,
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
    const state_ids = Object.keys(this.treatySelectedStates).filter(
      k => this.treatySelectedStates[k],
    );

    // Build lobs structure
    const selectedLobIds = Object.keys(this.treatySelectedLobs).filter(
      lobId => this.treatySelectedLobs[lobId],
    );
    const selectedCobIds = Object.keys(this.treatySelectedCobs).filter(
      cobId => this.treatySelectedCobs[cobId],
    );

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
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      effective_date: this.treatyForm.effective_date || null,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      expiration_date: this.treatyForm.expiration_date || null,
      state_ids,
      lobs,
      carriers,
      reinsurers,
    };

    if (this.isEditMode && !this.treatyForm.id) return;
    const request = this.isEditMode
      ? this.service.updateTreaty(this.treatyForm.id as string, payload)
      : this.service.createTreaty(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Treaty saved successfully');
        this.showTreatyModal = false;
        this.submitting = false;
        this.loadData();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should also fall back to the default message
        this.toast.error(err.error?.message || 'Failed to save treaty');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  addCarrierRow(): void {
    if (!this.treatyForm.carriers) {
      this.treatyForm.carriers = [];
    }
    this.treatyForm.carriers.push({
      risk_company_id: '',
      retention_pct: 100,
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
      cession_pct: 0,
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
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty error message should also fall back to the default
          this.toast.error(err.error?.message || 'Failed to delete treaty');
        },
      });
    };
    this.confirmOpen = true;
  }

  getMgasListDisplay(treaty: Treaty): string {
    if (treaty.treaty_mgas && treaty.treaty_mgas.length > 0) {
      return treaty.treaty_mgas
        .map(m => m.mga?.name)
        .filter(Boolean)
        .join(', ');
    }
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
    return treaty.mga?.name || '-';
  }

  getCarriersListDisplay(treaty: Treaty): string {
    if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
      return (
        treaty.treaty_carriers
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          .map(tc => `${tc.risk_company?.name || 'Unknown'} (${tc.retention_pct}%)`)
          .join(', ')
      );
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

  getLobsListDisplay(lobs?: TreatyLob[]): string {
    if (!lobs || lobs.length === 0) return '-';
    return lobs
      .map(l => {
        const lobName = l.lob?.lob_code;
        const cobs = l.treaty_lob_cobs
          ?.map(c => c.cob?.cob_code)
          .filter(Boolean)
          .join('/');
        return cobs ? `${lobName} (${cobs})` : lobName;
      })
      .filter(Boolean)
      .join(', ');
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
      case 'state':
        return 'State';
      case 'lob':
        return 'Line of Business';
      case 'cob':
        return 'Class of Business';
      case 'reinsurer':
        return 'Reinsurer Company';
      case 'risk-company':
        return 'Risk Company';
      case 'broker':
        return 'Broker';
      case 'product':
        return 'Product';
      case 'document-type':
        return 'Document Type';
      case 'sequence-prefix-counter':
        return 'Sequence Prefix & Counter';
      default:
        return 'Master';
    }
  }

  private getCodeKey(mode: string): string {
    switch (mode) {
      case 'state':
        return 'state_code';
      case 'lob':
        return 'lob_code';
      case 'cob':
        return 'cob_code';
      case 'reinsurer':
        return 'reinsurer_company_id';
      case 'risk-company':
        return 'risk_company_id';
      default:
        return 'code';
    }
  }

  exportToExcel(): void {
    let headers: string[] = [];
    let rows: (string | number | null | undefined)[][] = [];
    let filename = '';

    switch (this.currentTab) {
      case 'treaties':
        headers = ['Code', 'Treaty Name', 'MGA', 'Risk Company', 'States', 'LOBs (COBs)', 'Status'];
        rows = this.treaties.map(t => [
          t.treaty_code,
          t.name,
          this.getMgasListDisplay(t),
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          t.risk_company?.name || '-',
          this.getStatesListDisplay(t.treaty_states),
          this.getLobsListDisplay(t.treaty_lobs),
          t.is_active ? 'Active' : 'Inactive',
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
          m.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'mgas.csv';
        break;

      case 'states':
        headers = ['State Code', 'State Abbr', 'State Name', 'Status'];
        rows = this.states.map(s => [
          s.state_code,
          s.state_abbr,
          s.name,
          s.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'states.csv';
        break;

      case 'risk-companies':
        headers = [
          'Company',
          'ID Name',
          'Name',
          'Phone',
          'Admitted',
          'State',
          'Address 1',
          'Zip',
          'City',
          'Status',
        ];
        rows = this.riskCompanies.map(r => [
          r.company_id,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.id_name || '-',
          r.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.phone || '-',
          r.is_admitted ? 'Yes' : 'No',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.state || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.address || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.zip || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          r.city || '-',
          r.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'risk_companies.csv';
        break;

      case 'lobs':
        headers = [
          'LOB Code',
          'LOB Name',
          'Taxable',
          'Priority',
          'Fully Earned',
          'Status',
          'Description',
        ];
        rows = this.lobs.map(l => [
          l.lob_code,
          l.name,
          l.taxable ? 'Yes' : 'No',
          l.priority,
          l.fully_earned ? 'Yes' : 'No',
          l.is_active ? 'Active' : 'Inactive',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          l.description || '-',
        ]);
        filename = 'lobs.csv';
        break;

      case 'cobs':
        headers = [
          'Class Code',
          'Class Name',
          'Class Type',
          'Taxable',
          'Priority',
          'Fully Earned',
          'Status',
          'Description',
        ];
        rows = this.cobs.map(c => [
          c.cob_code,
          c.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          c.type || '-',
          c.taxable ? 'Yes' : 'No',
          c.priority,
          c.fully_earned ? 'Yes' : 'No',
          c.is_active ? 'Active' : 'Inactive',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          c.description || '-',
        ]);
        filename = 'cobs.csv';
        break;

      case 'reinsurers':
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'reinsurers.csv';
        break;

      case 'gl-mappings':
        headers = ['GL Number', 'Type'];
        rows = this.glMappings.map(m => [this.getGLNumberDisplay(m), m.type]);
        filename = 'gl_mappings.csv';
        break;

      case 'document-types':
        headers = ['Code', 'Name', 'Description', 'Status'];
        rows = this.documentTypes.map(d => [
          d.code,
          d.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          d.description || '-',
          d.isActive ? 'Active' : 'Inactive',
        ]);
        filename = 'document_types.csv';
        break;

      case 'sequence-prefix-counters':
        headers = [
          'Code',
          'Name',
          'Prefix',
          'Next Value',
          'Padding Width',
          'Description',
          'Status',
        ];
        rows = this.sequencePrefixCounters.map(s => [
          s.code,
          s.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.prefix || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.next_value !== undefined ? s.next_value : s.nextValue || 1,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.padding_width !== undefined ? s.padding_width : s.paddingWidth || 4,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.description || '-',
          s.isActive ? 'Active' : 'Inactive',
        ]);
        filename = 'sequence_prefix_counters.csv';
        break;
    }

    this.downloadCSV(headers, rows, filename);
  }

  private downloadCSV(
    headers: string[],
    rows: (string | number | null | undefined)[][],
    filename: string,
  ): void {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        row
          .map(val => {
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
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
      next: data => {
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          this.glMappings = data.filter(m => {
            const typeMatch = m.type.toLowerCase().includes(term);
            const code = m.coa?.account_code?.toString() ?? '';
            const desc = m.coa?.description?.toLowerCase() ?? '';
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
      next: data => {
        this.coaOptions = data.filter(coa => !coa.is_parent);
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
        error: err => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
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
        error: err => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
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
    return this.seededProgramITD.has((programName || '').trim());
  }

  getTreatyStatus(programName?: string): string {
    if (!programName) return 'Draft';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
    return this.treatyWorkbookStatuses.get(programName) || 'Pending';
  }

  getGLNumberDisplay(mapping: GlMapping): string {
    if (!mapping.coa) return '-';
    return `${mapping.coa.account_code} - ${mapping.coa.description}`;
  }

  selectedTreatyForUpload: Treaty | null = null;

  triggerTreatyMonthlyUpload(treaty: Treaty): void {
    this.selectedTreatyForUpload = treaty;
    if (this.monthlyExcelInput?.nativeElement) {
      this.monthlyExcelInput.nativeElement.click();
    }
  }

  triggerTreatyITDUpload(treaty: Treaty): void {
    this.selectedTreatyForUpload = treaty;
    if (this.itdExcelInput?.nativeElement) {
      this.itdExcelInput.nativeElement.click();
    }
  }

  onTreatyMonthlyUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedTreatyForUpload) {
      const file = input.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading monthly exhibit for treaty: ${programName}...`);

      this.reinsuranceService.uploadWorkbook(file, false, programName).subscribe({
        next: () => {
          this.toast.success(`Successfully uploaded monthly exhibit for ${programName}.`);
          this.selectedTreatyForUpload = null;
          input.value = '';
          this.loadData();
        },
        error: err => {
          const msg = err.error?.message ?? 'Failed to upload monthly exhibit';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          input.value = '';
        },
      });
    }
  }

  onTreatyITDUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedTreatyForUpload) {
      const file = input.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading and seeding ITD baseline for treaty: ${programName}...`);

      this.reinsuranceService.uploadWorkbook(file, true, programName).subscribe({
        next: () => {
          this.toast.success(
            `ITD baseline reserves uploaded and seeded for ${programName} successfully.`,
          );
          this.selectedTreatyForUpload = null;
          input.value = '';
          this.loadData();
        },
        error: err => {
          const msg = err.error?.message ?? 'Failed to seed ITD baseline';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          input.value = '';
        },
      });
    }
  }
  openAddItdModal(treaty: Treaty): void {
    this.selectedTreatyForItd = treaty;
    this.itdForm.program = treaty.name;
    this.itdSelectedMonth = '12';
    this.itdSelectedYear = '2025';
    this.itdForm.month_key = '2025-12';
    this.itdForm.month_label = 'December 2025';

    const states: ItdStateOption[] = (treaty.treaty_states ?? [])
      .map((s: TreatyState) => {
        const code = s.state?.state_code ?? '';
        const abbr = s.state?.state_abbr ?? String(code);
        return { code: String(code), label: String(abbr) };
      })
      .filter((s: ItdStateOption) => s.code);

    this.itdStatesList = [
      { code: 'TOTAL', label: 'TOTAL' },
      ...states
        .filter((s: ItdStateOption) => s.code !== 'TOTAL')
        .sort((a: ItdStateOption, b: ItdStateOption) => a.label.localeCompare(b.label)),
    ];
    this.itdSelectedStateCode = 'TOTAL';

    this.itdForm.exhibits = {};
    for (const st of this.itdStatesList) {
      this.itdForm.exhibits[st.code] = {
        uep: 0,
        loss_reserves: 0,
        loss_ibnr: 0,
        lae_reserves_dcc: 0,
        lae_ibnr_dcc: 0,
        lae_reserves_aoe: 0,
        lae_ibnr_aoe: 0,
        ulae_ibnr: 0,
      };
    }

    const wbId = this.itdWorkbookIds.get(treaty.name);
    if (wbId) {
      this.reinsuranceService.getWorkbook(wbId).subscribe({
        next: wbDetail => {
          const exhibits = wbDetail.stateExhibits ?? wbDetail.state_exhibits ?? [];

          const getVal = (val: unknown): number => {
            if (Array.isArray(val)) return Number(val[val.length - 1] ?? 0);
            return Number(val ?? 0);
          };

          for (const se of exhibits) {
            const stateCode = String(se.stateCode ?? se.state_code);
            if (stateCode && this.itdForm.exhibits[stateCode]) {
              this.itdForm.exhibits[stateCode] = {
                uep: getVal(se.uep),
                loss_reserves: getVal(se.loss_reserves ?? se.lossReserves),
                loss_ibnr: getVal(se.loss_ibnr ?? se.lossIbnr),
                lae_reserves_dcc: getVal(se.lae_reserves_dcc ?? se.laeReservesDcc),
                lae_ibnr_dcc: getVal(se.lae_ibnr_dcc ?? se.laeIbnrDcc),
                lae_reserves_aoe: getVal(se.lae_reserves_aoe ?? se.laeReservesAoe),
                lae_ibnr_aoe: getVal(se.lae_ibnr_aoe ?? se.laeIbnrAoe),
                ulae_ibnr: getVal(se.ulae_ibnr ?? se.ulaeIbnr),
              };
            }
          }
          this.showItdModal = true;
          this.cdr.markForCheck();
        },
        error: () => {
          console.error('Failed to load existing ITD data');
          this.showItdModal = true;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.showItdModal = true;
      this.cdr.markForCheck();
    }
  }

  saveManualITD(): void {
    if (!this.selectedTreatyForItd) return;

    const exhibitsArray = Object.keys(this.itdForm.exhibits).map(code => {
      const ex = this.itdForm.exhibits[code];
      return {
        state_code: code,
        uep: Number(ex.uep ?? 0),
        loss_reserves: Number(ex.loss_reserves ?? 0),
        loss_ibnr: Number(ex.loss_ibnr ?? 0),
        lae_reserves_dcc: Number(ex.lae_reserves_dcc ?? 0),
        lae_ibnr_dcc: Number(ex.lae_ibnr_dcc ?? 0),
        lae_reserves_aoe: Number(ex.lae_reserves_aoe ?? 0),
        lae_ibnr_aoe: Number(ex.lae_ibnr_aoe ?? 0),
        ulae_ibnr: Number(ex.ulae_ibnr ?? 0),
      };
    });

    const payload = {
      program: this.itdForm.program,
      monthKey: this.itdForm.month_key,
      monthLabel: this.itdForm.month_label,
      exhibits: exhibitsArray,
    };

    this.reinsuranceService.createManualITD(payload).subscribe({
      next: () => {
        this.toast.success(`Successfully saved manual ITD baseline for ${payload.program}`);
        this.showItdModal = false;
        this.selectedTreatyForItd = null;
        this.loadData();
      },
      error: err => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        this.toast.error(err.error?.message || 'Failed to save manual ITD baseline');
      },
    });
  }

  submitLockPeriod(): void {
    if (!this.newPeriodToLock) return;
    this.submitting = true;
    this.service.lockPeriod(this.newPeriodToLock).subscribe({
      next: () => {
        this.toast.success(`Successfully locked period "${this.newPeriodToLock}"`);
        this.showLockPeriodModal = false;
        this.newPeriodToLock = '';
        this.submitting = false;
        this.loadData();
      },
      error: err => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
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
        this.loadData();
      },
      error: err => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        this.toast.error(err.error?.message || `Failed to ${lock ? 'lock' : 'unlock'} period`);
      },
    });
  }

  openLockPeriodAdd(): void {
    this.newPeriodToLock = '';
    this.showLockPeriodModal = true;
    this.cdr.markForCheck();
  }

  onProductLobCobChange(): void {
    const selectedLob = this.lobOptions.find(l => l.id === this.simpleForm.lob_id);
    const selectedCob = this.cobOptions.find(c => c.id === this.simpleForm.cob_id);

    const lobCode = selectedLob ? selectedLob.lob_code : '';
    const cobCode = selectedCob ? selectedCob.cob_code : '';

    if (lobCode && cobCode) {
      this.simpleForm.code = `${lobCode}-${cobCode}`;
      this.simpleForm.name = `${selectedLob?.name} - ${selectedCob?.name}`;
    } else {
      this.simpleForm.code = '';
      this.simpleForm.name = '';
    }
  }
}
