import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ColDef, GridOptions } from 'ag-grid-community';
import { AgGridConfigService } from '../../core/services/ag-grid-config.service';
import { MastersGrid } from './components/masters-grid/masters-grid';
import { NotesModal } from '../../shared/components/notes-modal/notes-modal';
import { DocumentDrawer, DrawerDocument } from './components/document-drawer/document-drawer';
import { StateFormModal, StateFormValue } from './components/state-form-modal/state-form-modal';
import {
  GlMappingFormModal,
  GlMappingFormValue,
} from './components/gl-mapping-form-modal/gl-mapping-form-modal';
import { LockPeriodModal } from './components/lock-period-modal/lock-period-modal';
import {
  RiskCompanyFormModal,
  RiskCompanyFormValue,
} from './components/risk-company-form-modal/risk-company-form-modal';
import { ItdFormModal, ItdFormValue } from './components/itd-form-modal/itd-form-modal';
import {
  SimpleFormModal,
  SimpleFormValue,
  SimpleMode,
} from './components/simple-form-modal/simple-form-modal';
import { MgaFormModal, MgaFormValue } from './components/mga-form-modal/mga-form-modal';
import { TreatyFormModal, TreatySaveEvent } from './components/treaty-form-modal/treaty-form-modal';
import { StatusBadgeCell } from '../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { StatesApi } from './services/states-api';
import { MgasApi } from './services/mgas-api';
import { ReinsurersApi } from './services/reinsurers-api';
import { RiskCompaniesApi } from './services/risk-companies-api';
import { LobsApi } from './services/lobs-api';
import { CobsApi } from './services/cobs-api';
import { TreatiesApi } from './services/treaties-api';
import { BrokersApi } from './services/brokers-api';
import { ProductsApi } from './services/products-api';
import { LockedPeriodsApi } from './services/locked-periods-api';
import { DocumentTypesApi } from './services/document-types-api';
import { SequencePrefixCountersApi } from './services/sequence-prefix-counters-api';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';
import {
  StateMaster,
  MgaMaster,
  ReinsurerCompany,
  RiskCompany,
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
import {
  MasterTab,
  MasterListItem,
  SimpleEditableItem,
  DocumentableMaster,
  MasterDocument,
  DocumentMode,
} from './models/master-tab.model';
import { ItdExhibit, ItdForm, ItdStateOption } from './models/itd.model';
import { HttpErrorLike } from '../../core/models/http-error.model';
import { ActiveStatusFilter } from '../../core/models/active-status-filter.model';
import { GlMappingsApi } from './services/gl-mappings-api';
import { ChartOfAccountsApi } from '../chart-of-accounts/services/chart-of-accounts-api';
import { GlMapping, GlMappingType } from './models/gl-mapping.model';
import { ChartOfAccount } from '../../core/models/chart-of-account.model';
import { ReinsuranceApi } from '../reinsurance-calculations/services/reinsurance-api';
import { buildTreatiesColumnDefs } from './grid-columns/treaties-columns';
import { buildMgasColumnDefs } from './grid-columns/mgas-columns';
import { buildStatesColumnDefs } from './grid-columns/states-columns';
import { buildRiskCompaniesColumnDefs } from './grid-columns/risk-companies-columns';
import { buildGlMappingsColumnDefs } from './grid-columns/gl-mappings-columns';
import { buildLobsColumnDefs } from './grid-columns/lobs-columns';
import { buildCobsColumnDefs } from './grid-columns/cobs-columns';
import { buildReinsurersColumnDefs } from './grid-columns/reinsurers-columns';
import { buildBrokersColumnDefs } from './grid-columns/brokers-columns';
import { buildProductsColumnDefs } from './grid-columns/products-columns';
import { buildLockedPeriodsColumnDefs } from './grid-columns/locked-periods-columns';
import { buildDocumentTypesColumnDefs } from './grid-columns/document-types-columns';
import { buildSequencePrefixCountersColumnDefs } from './grid-columns/sequence-prefix-counters-columns';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    MastersGrid,
    NotesModal,
    DocumentDrawer,
    StateFormModal,
    GlMappingFormModal,
    LockPeriodModal,
    RiskCompanyFormModal,
    ItdFormModal,
    SimpleFormModal,
    MgaFormModal,
    TreatyFormModal,
  ],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  protected readonly MasterTab = MasterTab;
  protected readonly SimpleMode = SimpleMode;

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

  glMappingTypeOptionsList = Object.values(GlMappingType).map(type => ({ id: type, name: type }));
  private statesApi = inject(StatesApi);
  private mgasApi = inject(MgasApi);
  private reinsurersApi = inject(ReinsurersApi);
  private riskCompaniesApi = inject(RiskCompaniesApi);
  private lobsApi = inject(LobsApi);
  private cobsApi = inject(CobsApi);
  private treatiesApi = inject(TreatiesApi);
  private brokersApi = inject(BrokersApi);
  private productsApi = inject(ProductsApi);
  private lockedPeriodsApi = inject(LockedPeriodsApi);
  private documentTypesApi = inject(DocumentTypesApi);
  private sequencePrefixCountersApi = inject(SequencePrefixCountersApi);
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

  currentTab: MasterTab = MasterTab.Treaties;
  glMappings: GlMapping[] = [];
  coaOptions: ChartOfAccount[] = [];
  showGlMappingModal = false;
  glMappingModalTitle = 'Add GL Mapping';
  glMappingForm: Partial<GlMapping> = {
    coa_id: '',
    type: '',
  };
  loading = false;
  searchTerm = '';
  statusFilter: ActiveStatusFilter = ActiveStatusFilter.All;
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
  simpleMode: SimpleMode = SimpleMode.Lob;
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
  documentMode: DocumentMode = DocumentMode.Mga;
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
    this.mgasApi.getMgas(undefined, true).subscribe(res => {
      this.mgaOptions = res;
      this.cdr.markForCheck();
    });

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MasterTab;
      if (tab && Object.values(MasterTab).includes(tab)) {
        this.currentTab = tab;
      } else {
        this.currentTab = MasterTab.Treaties;
      }
      this.searchTerm = '';
      this.statusFilter = ActiveStatusFilter.All;
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
    if (this.statusFilter === ActiveStatusFilter.Active) return true;
    if (this.statusFilter === ActiveStatusFilter.Inactive) return false;
    return undefined;
  }

  loadData(): void {
    this.loading = true;
    const search = this.searchTerm || undefined;
    const active = this.activeFilterStatus;

    switch (this.currentTab) {
      case MasterTab.Treaties:
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
            this.treatiesApi.getTreaties(search, active).subscribe({
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
            this.treatiesApi.getTreaties(search, active).subscribe({
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
      case MasterTab.Mgas:
        this.mgasApi.getMgas(search, active).subscribe({
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
      case MasterTab.Lobs:
        this.lobsApi.getLobs(search, active).subscribe({
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
      case MasterTab.Cobs:
        this.cobsApi.getCobs(search, active).subscribe({
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
      case MasterTab.States:
        this.statesApi.getStates(search, active).subscribe({
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
      case MasterTab.Reinsurers:
        this.reinsurersApi.getReinsurers(search, active).subscribe({
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
      case MasterTab.RiskCompanies:
        this.riskCompaniesApi.getRiskCompanies(search, active).subscribe({
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
      case MasterTab.GlMappings:
        this.loadGlMappings();
        break;
      case MasterTab.Brokers:
        this.brokersApi.getBrokers(search, active).subscribe({
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
      case MasterTab.Products:
        this.productsApi.getProducts(search, active).subscribe({
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
      case MasterTab.LockedPeriods:
        this.lockedPeriodsApi.getLockedPeriods(search).subscribe({
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
      case MasterTab.DocumentTypes:
        this.documentTypesApi.getDocumentTypes(search, active).subscribe({
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
      case MasterTab.SequencePrefixCounters:
        this.sequencePrefixCountersApi.getSequencePrefixCounters(search, active).subscribe({
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
      case MasterTab.Treaties: {
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
      case MasterTab.Mgas:
        return this.mgas;
      case MasterTab.Lobs:
        return this.lobs;
      case MasterTab.Cobs:
        return this.cobs;
      case MasterTab.States:
        return this.states;
      case MasterTab.Reinsurers:
        return this.reinsurers;
      case MasterTab.RiskCompanies:
        return this.riskCompanies;
      case MasterTab.GlMappings:
        return this.glMappings;
      case MasterTab.Brokers:
        return this.brokers;
      case MasterTab.Products:
        return this.products;
      case MasterTab.LockedPeriods:
        return this.lockedPeriods;
      case MasterTab.DocumentTypes:
        return this.documentTypes;
      case MasterTab.SequencePrefixCounters:
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
      case MasterTab.Treaties:
        return buildTreatiesColumnDefs(this);
      case MasterTab.Mgas:
        return buildMgasColumnDefs(this, statusCol);
      case MasterTab.States:
        return buildStatesColumnDefs(this);
      case MasterTab.RiskCompanies:
        return buildRiskCompaniesColumnDefs(this);
      case MasterTab.GlMappings:
        return buildGlMappingsColumnDefs(this);
      case MasterTab.Lobs:
        return buildLobsColumnDefs(this, statusCol);
      case MasterTab.Cobs:
        return buildCobsColumnDefs(this, statusCol);
      case MasterTab.Reinsurers:
        return buildReinsurersColumnDefs(this, statusCol);
      case MasterTab.Brokers:
        return buildBrokersColumnDefs(this, statusCol);
      case MasterTab.Products:
        return buildProductsColumnDefs(this, statusCol);
      case MasterTab.LockedPeriods:
        return buildLockedPeriodsColumnDefs(this);
      case MasterTab.DocumentTypes:
        return buildDocumentTypesColumnDefs(this, statusCol);
      case MasterTab.SequencePrefixCounters:
        return buildSequencePrefixCountersColumnDefs(this, statusCol);
      default:
        return [];
    }
  }

  // ==========================================
  // SIMPLE MASTERS ACTIONS
  // ==========================================
  openSimpleAdd(mode: SimpleMode): void {
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

  openSimpleEdit(mode: SimpleMode, item: SimpleEditableItem): void {
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

  submitSimple(formValue: SimpleFormValue): void {
    this.simpleForm = formValue;
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

    if (this.simpleMode === SimpleMode.Lob || this.simpleMode === SimpleMode.Cob) {
      payload['description'] = this.simpleForm.description || null;
      payload['type'] = this.simpleMode === SimpleMode.Cob ? this.simpleForm.type || null : null;
      payload['taxable'] = this.simpleForm.taxable || false;
      payload['priority'] = Number(this.simpleForm.priority || 1);
      payload['fully_earned'] = this.simpleForm.fully_earned || false;
    } else if (this.simpleMode === SimpleMode.Broker) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_name'] = this.simpleForm.contact_name || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_email'] = this.simpleForm.contact_email || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_phone'] = this.simpleForm.contact_phone || null;
    } else if (this.simpleMode === SimpleMode.Product) {
      payload['description'] = this.simpleForm.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['lob_id'] = this.simpleForm.lob_id || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['cob_id'] = this.simpleForm.cob_id || null;
    } else if (this.simpleMode === SimpleMode.SequencePrefixCounter) {
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
        case SimpleMode.Lob:
          request = this.lobsApi.updateLob(id, payload as Partial<LineOfBusiness>);
          break;
        case SimpleMode.Cob:
          request = this.cobsApi.updateCob(id, payload as Partial<CobMaster>);
          break;
        case SimpleMode.Reinsurer:
          request = this.reinsurersApi.updateReinsurer(id, payload as Partial<ReinsurerCompany>);
          break;
        case SimpleMode.Broker:
          request = this.brokersApi.updateBroker(id, payload as SimpleMasterRecord);
          break;
        case SimpleMode.Product:
          request = this.productsApi.updateProduct(id, payload as SimpleMasterRecord);
          break;
        case SimpleMode.DocumentType:
          request = this.documentTypesApi.updateDocumentType(id, payload as Partial<DocumentType>);
          break;
        case SimpleMode.SequencePrefixCounter:
          request = this.sequencePrefixCountersApi.updateSequencePrefixCounter(
            id,
            payload as Partial<SequencePrefixCounter>,
          );
          break;
      }
    } else {
      switch (this.simpleMode) {
        case SimpleMode.Lob:
          request = this.lobsApi.createLob(payload as Partial<LineOfBusiness>);
          break;
        case SimpleMode.Cob:
          request = this.cobsApi.createCob(payload as Partial<CobMaster>);
          break;
        case SimpleMode.Reinsurer:
          request = this.reinsurersApi.createReinsurer(payload as Partial<ReinsurerCompany>);
          break;
        case SimpleMode.Broker:
          request = this.brokersApi.createBroker(payload as SimpleMasterRecord);
          break;
        case SimpleMode.Product:
          request = this.productsApi.createProduct(payload as SimpleMasterRecord);
          break;
        case SimpleMode.DocumentType:
          request = this.documentTypesApi.createDocumentType(payload as Partial<DocumentType>);
          break;
        case SimpleMode.SequencePrefixCounter:
          request = this.sequencePrefixCountersApi.createSequencePrefixCounter(
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

  deleteSimple(mode: SimpleMode, item: SimpleEditableItem): void {
    this.confirmTitle = `Delete ${this.getMasterLabel(mode)}`;
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      if (!item.id) return;
      const id = item.id;
      let request!: Observable<unknown>;
      switch (mode) {
        case SimpleMode.Lob:
          request = this.lobsApi.deleteLob(id);
          break;
        case SimpleMode.Cob:
          request = this.cobsApi.deleteCob(id);
          break;
        case SimpleMode.Reinsurer:
          request = this.reinsurersApi.deleteReinsurer(id);
          break;
        case SimpleMode.Broker:
          request = this.brokersApi.deleteBroker(id);
          break;
        case SimpleMode.Product:
          request = this.productsApi.deleteProduct(id);
          break;
        case SimpleMode.DocumentType:
          request = this.documentTypesApi.deleteDocumentType(id);
          break;
        case SimpleMode.SequencePrefixCounter:
          request = this.sequencePrefixCountersApi.deleteSequencePrefixCounter(id);
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

  submitMga(formValue: MgaFormValue): void {
    this.mgaForm = formValue;
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
      this.mgasApi.updateMga(this.mgaForm.id, payload).subscribe({
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
      this.mgasApi.createMga(payload).subscribe({
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
      this.mgasApi.deleteMga(mga.id).subscribe({
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

  openDocModal(mode: DocumentMode, item: MgaMaster | StateMaster | RiskCompany): void {
    this.documentMode = mode;
    this.selectedItem = item;
    this.documentsList = [];
    this.selectedDocType = '';
    this.documentTypesOptions = [];
    this.showDocModal = true;

    this.documentTypesApi.getDocumentTypes(undefined, true).subscribe(res => {
      this.documentTypesOptions = res;
      this.cdr.markForCheck();
    });

    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;
    let request: Observable<DocumentableMaster>;
    if (this.documentMode === DocumentMode.Mga) {
      request = this.mgasApi.getMga(id);
    } else if (this.documentMode === DocumentMode.State) {
      request = this.statesApi.getState(id);
    } else {
      request = this.riskCompaniesApi.getRiskCompany(id);
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
    if (this.documentMode === DocumentMode.Mga) {
      request = this.mgasApi.uploadMgaDocument(this.selectedItem.id, file, documentType);
    } else if (this.documentMode === DocumentMode.State) {
      request = this.statesApi.uploadStateDocument(this.selectedItem.id, file, documentType);
    } else {
      request = this.riskCompaniesApi.uploadRiskCompanyDocument(
        this.selectedItem.id,
        file,
        documentType,
      );
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
    if (this.documentMode === DocumentMode.Mga) {
      endpoint = 'mgas';
    } else if (this.documentMode === DocumentMode.State) {
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
      if (this.documentMode === DocumentMode.Mga) {
        request = this.mgasApi.deleteMgaDocument(doc.id);
      } else if (this.documentMode === DocumentMode.State) {
        request = this.statesApi.deleteStateDocument(doc.id);
      } else {
        request = this.riskCompaniesApi.deleteRiskCompanyDocument(doc.id);
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

  submitState(formValue: StateFormValue): void {
    this.stateForm = formValue;
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
      ? this.statesApi.updateState(this.stateForm.id as string, payload)
      : this.statesApi.createState(payload);

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
      this.statesApi.deleteState(state.id).subscribe({
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

  submitRiskCompany(formValue: RiskCompanyFormValue): void {
    this.riskCompanyForm = formValue;
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
      ? this.riskCompaniesApi.updateRiskCompany(this.riskCompanyForm.id as string, payload)
      : this.riskCompaniesApi.createRiskCompany(payload);

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
      this.riskCompaniesApi.deleteRiskCompany(rc.id).subscribe({
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
    this.mgasApi.getMgas(undefined, true).subscribe(res => {
      this.mgaOptions = res;
      this.cdr.markForCheck();
    });
    this.reinsurersApi.getReinsurers(undefined, true).subscribe(res => {
      this.reinsurerOptions = res;
      this.cdr.markForCheck();
    });
    this.riskCompaniesApi.getRiskCompanies(undefined, true).subscribe(res => {
      this.riskCompanyOptions = res;
      this.cdr.markForCheck();
    });
    this.lobsApi.getLobs(undefined, true).subscribe(res => {
      this.lobOptions = res;
      this.cdr.markForCheck();
    });
    this.cobsApi.getCobs(undefined, true).subscribe(res => {
      this.cobOptions = res;
      this.cdr.markForCheck();
    });
    this.statesApi.getStates(undefined, true).subscribe(res => {
      this.stateOptions = res;
      this.cdr.markForCheck();
    });
    this.brokersApi.getBrokers(undefined, true).subscribe(res => {
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

  submitTreaty(event: TreatySaveEvent): void {
    this.treatyForm = event.form;
    this.treatySelectedStates = event.selectedStates;
    this.treatySelectedLobs = event.selectedLobs;
    this.treatySelectedCobs = event.selectedCobs;

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
      ? this.treatiesApi.updateTreaty(this.treatyForm.id as string, payload)
      : this.treatiesApi.createTreaty(payload);

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

  deleteTreaty(treaty: Treaty): void {
    this.confirmTitle = 'Delete Treaty';
    this.confirmMessage = `Are you sure you want to delete treaty "${treaty.treaty_code}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.treatiesApi.deleteTreaty(treaty.id).subscribe({
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
      case SimpleMode.Lob:
        return 'Line of Business';
      case SimpleMode.Cob:
        return 'Class of Business';
      case SimpleMode.Reinsurer:
        return 'Reinsurer Company';
      case 'risk-company':
        return 'Risk Company';
      case SimpleMode.Broker:
        return 'Broker';
      case SimpleMode.Product:
        return 'Product';
      case SimpleMode.DocumentType:
        return 'Document Type';
      case SimpleMode.SequencePrefixCounter:
        return 'Sequence Prefix & Counter';
      default:
        return 'Master';
    }
  }

  private getCodeKey(mode: string): string {
    switch (mode) {
      case 'state':
        return 'state_code';
      case SimpleMode.Lob:
        return 'lob_code';
      case SimpleMode.Cob:
        return 'cob_code';
      case SimpleMode.Reinsurer:
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
      case MasterTab.Treaties:
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

      case MasterTab.Mgas:
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

      case MasterTab.States:
        headers = ['State Code', 'State Abbr', 'State Name', 'Status'];
        rows = this.states.map(s => [
          s.state_code,
          s.state_abbr,
          s.name,
          s.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'states.csv';
        break;

      case MasterTab.RiskCompanies:
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

      case MasterTab.Lobs:
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

      case MasterTab.Cobs:
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

      case MasterTab.Reinsurers:
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'reinsurers.csv';
        break;

      case MasterTab.GlMappings:
        headers = ['GL Number', 'Type'];
        rows = this.glMappings.map(m => [this.getGLNumberDisplay(m), m.type]);
        filename = 'gl_mappings.csv';
        break;

      case MasterTab.DocumentTypes:
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

      case MasterTab.SequencePrefixCounters:
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

  submitGlMapping(formValue: GlMappingFormValue): void {
    this.glMappingForm = formValue;
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
    this.itdSelectedMonth = '12';
    this.itdSelectedYear = '2025';

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

    const blankExhibits: Record<string, ItdExhibit> = {};
    for (const st of this.itdStatesList) {
      blankExhibits[st.code] = {
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
    this.itdForm = {
      ...this.itdForm,
      program: treaty.name,
      month_key: '2025-12',
      month_label: 'December 2025',
      exhibits: blankExhibits,
    };

    const wbId = this.itdWorkbookIds.get(treaty.name);
    if (wbId) {
      this.reinsuranceService.getWorkbook(wbId).subscribe({
        next: wbDetail => {
          const exhibits = wbDetail.stateExhibits ?? wbDetail.state_exhibits ?? [];

          const getVal = (val: unknown): number => {
            if (Array.isArray(val)) return Number(val[val.length - 1] ?? 0);
            return Number(val ?? 0);
          };

          const loadedExhibits: Record<string, ItdExhibit> = { ...this.itdForm.exhibits };
          for (const se of exhibits) {
            const stateCode = String(se.stateCode ?? se.state_code);
            if (stateCode && loadedExhibits[stateCode]) {
              loadedExhibits[stateCode] = {
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
          this.itdForm = { ...this.itdForm, exhibits: loadedExhibits };
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

  saveManualITD(formValue: ItdFormValue): void {
    this.itdForm = { ...this.itdForm, ...formValue };

    if (!this.selectedTreatyForItd) return;

    const exhibitsArray = Object.keys(formValue.exhibits).map(code => {
      const ex = formValue.exhibits[code];
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
      program: formValue.program,
      monthKey: formValue.month_key,
      monthLabel: formValue.month_label,
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

  submitLockPeriod(period: string): void {
    this.newPeriodToLock = period;
    if (!this.newPeriodToLock) return;
    this.submitting = true;
    this.lockedPeriodsApi.lockPeriod(this.newPeriodToLock).subscribe({
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
    const action = lock
      ? this.lockedPeriodsApi.lockPeriod(period)
      : this.lockedPeriodsApi.unlockPeriod(period);
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
}
