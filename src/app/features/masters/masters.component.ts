import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
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
import { SimpleFormModal, SimpleFormValue, createBlankSimpleForm } from './components/simple-form-modal/simple-form-modal';
import { MgaFormModal, MgaFormValue, createBlankMgaForm } from './components/mga-form-modal/mga-form-modal';
import { TreatyFormModal, TreatyFormShape, TreatySaveEvent, createBlankTreatyForm } from './components/treaty-form-modal/treaty-form-modal';
import {
  ActionButtonConfig,
  ActionButtonsCell,
} from '../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';
import { StatusBadgeCell } from '../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import { MastersApi } from './services/masters-api';
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
  TreatyProduct,
  TreatyReinsurer,
  DocumentType,
  SequencePrefixMaster,
  TreatyTypeMaster,
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
  | SequencePrefixMaster
  | TreatyTypeMaster;

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
  | SequencePrefixMaster
  | TreatyTypeMaster;
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
  | 'sequence-prefix-counters'
  | 'treaty-types';

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
  productLabelFn = (item: SimpleMasterRecord) => item.name ?? '';
  treatyTypeLabelFn = (item: SimpleMasterRecord) => item.name ?? '';

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
  sequencePrefixMasters: SequencePrefixMaster[] = [];
  treatyTypes: TreatyTypeMaster[] = [];

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
    | 'sequence-prefix-counter'
    | 'treaty-type' = 'lob';
  isEditMode = false;
  submitting = false;

  // Simple Form Binding
  simpleForm: SimpleFormValue = createBlankSimpleForm();

  // MGA Modal
  showMgaModal = false;
  mgaModalTitle = '';
  mgaForm: MgaFormValue = createBlankMgaForm();

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

  // Treaty Modal
  showTreatyModal = false;
  treatyModalTitle = '';
  treatyForm: TreatyFormShape = createBlankTreatyForm();

  // Treaty dropdown options
  mgaOptions: MgaMaster[] = [];
  reinsurerOptions: ReinsurerCompany[] = [];
  riskCompanyOptions: RiskCompany[] = [];
  stateOptions: StateMaster[] = [];
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];
  showLockPeriodModal = false;
  newPeriodToLock = '';

  // Treaty UI selectors
  treatySelectedStates: { [stateId: string]: boolean } = {};
  treatySelectedProducts: { [productId: string]: boolean } = {};
  productOptions: SimpleMasterRecord[] = [];
  treatyTypeOptions: SimpleMasterRecord[] = [];

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
          'treaty-types',
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
        this.service.getSequencePrefixMasters(search, active).subscribe({
          next: res => {
            this.sequencePrefixMasters = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Sequence Prefix Masters');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'treaty-types':
        this.service.getTreatyTypes(search, active).subscribe({
          next: res => {
            this.treatyTypes = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load Treaty Types');
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
        return this.sequencePrefixMasters;
      case 'treaty-types':
        return this.treatyTypes;
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
            headerName: 'PRODUCTS',
            valueGetter: p => this.getProductsListDisplay(p.data?.treaty_products),
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
          { headerName: 'LEDGER AMOUNT', field: 'ledger_amount', flex: 1.2, minWidth: 120 },
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
          { headerName: 'BROKER CODE', field: 'broker_code', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'CONTACT NAME', field: 'contact_name', flex: 1.5, minWidth: 120 },
          { headerName: 'EMAIL', field: 'contact_email', flex: 2, minWidth: 150 },
          { headerName: 'PHONE', field: 'contact_phone', flex: 1.5, minWidth: 120 },
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
          { headerName: 'PRODUCT CODE', field: 'product_code', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
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
          { headerName: 'TYPE CODE', field: 'type_code', flex: 1.5, minWidth: 120 },
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
          { headerName: 'SEQUENCE TYPE', field: 'sequence_type', flex: 1.5, minWidth: 120 },
          { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
          { headerName: 'PREFIX', field: 'prefix', flex: 1, minWidth: 100 },
          { headerName: 'NEXT NUMBER', field: 'next_number', flex: 1, minWidth: 100 },
          { headerName: 'SEQ START', field: 'seq_start', flex: 1, minWidth: 80 },
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
              onClick: (action: string, data: SequencePrefixMaster) => {
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

      case 'treaty-types':
        return [
          { headerName: 'TYPE CODE', field: 'type_code', flex: 1.5, minWidth: 120 },
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
              onClick: (action: string, data: TreatyTypeMaster) => {
                if (action === 'edit') this.openSimpleEdit('treaty-type', data);
                if (action === 'delete') this.deleteSimple('treaty-type', data);
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
    this.simpleForm = createBlankSimpleForm();
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
        (rec['product_code'] as string) ||
        (rec['type_code'] as string) ||
        (rec['sequence_type'] as string) ||
        (rec['code'] as string) ||
        '',
      name: rec['name'] as string,
      is_active: rec['is_active'] as boolean,
      description: (rec['description'] as string) || '',
      type: (rec['type'] as string) || '',
      taxable: (rec['taxable'] as boolean) || false,
      priority: (rec['priority'] as number) || 1,
      fully_earned: (rec['fully_earned'] as boolean) || false,
      contact_name: (rec['contact_name'] as string) || '',
      contact_email: (rec['contact_email'] as string) || '',
      contact_phone: (rec['contact_phone'] as string) || '',
      prefix: (rec['prefix'] as string) || '',
      prefix_connector: (rec['prefix_connector'] as string) || '',
      seq_start: (rec['seq_start'] as number) ?? 1,
      next_number: rec['next_number'] !== undefined ? (rec['next_number'] as number) : 1,
      suffix: (rec['suffix'] as string) || '',
      suffix_connector: (rec['suffix_connector'] as string) || '',
      lob_ids: (rec['lob_ids'] as string[]) || [],
      cob_ids: (rec['cob_ids'] as string[]) || [],
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
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null
      payload['description'] = this.simpleForm.description || null;
      payload['lob_ids'] = this.simpleForm.lob_ids ?? [];
      payload['cob_ids'] = this.simpleForm.cob_ids ?? [];
    } else if (this.simpleMode === 'sequence-prefix-counter') {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null
      payload['description'] = this.simpleForm.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['prefix'] = this.simpleForm.prefix || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['prefix_connector'] = this.simpleForm.prefix_connector || null;
      payload['seq_start'] = Number(this.simpleForm.seq_start ?? 1);
      payload['next_number'] = Number(this.simpleForm.next_number ?? 1);
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['suffix'] = this.simpleForm.suffix || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['suffix_connector'] = this.simpleForm.suffix_connector || null;
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
          request = this.service.updateSequencePrefixMaster(
            id,
            payload as Partial<SequencePrefixMaster>,
          );
          break;
        case 'treaty-type':
          request = this.service.updateTreatyType(id, payload as Partial<TreatyTypeMaster>);
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
          request = this.service.createSequencePrefixMaster(
            payload as Partial<SequencePrefixMaster>,
          );
          break;
        case 'treaty-type':
          request = this.service.createTreatyType(payload as Partial<TreatyTypeMaster>);
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
          request = this.service.deleteSequencePrefixMaster(id);
          break;
        case 'treaty-type':
          request = this.service.deleteTreatyType(id);
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
    this.mgaForm = createBlankMgaForm();
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
      is_active: mga.is_active,
      ledger_amount: mga.ledger_amount ?? 0,
      company_id: mga.company_id ? Number(mga.company_id) : null,
      id_name: mga.id_name ?? '',
      address: mga.address ?? '',
      zip: mga.zip ?? '',
      city: mga.city ?? '',
      state: mga.state ?? '',
      phone: mga.phone ?? '',
      open_item: mga.open_item ?? false,
      op_start_date: mga.op_start_date ? mga.op_start_date.substring(0, 10) : '',
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
      mga_code: this.mgaForm.mga_code,
      name: this.mgaForm.name,
      is_active: this.mgaForm.is_active,
      ledger_amount: Number(this.mgaForm.ledger_amount || 0),
      company_id: this.mgaForm.company_id ? Number(this.mgaForm.company_id) : null,
      id_name: this.mgaForm.id_name || null,
      address: this.mgaForm.address || null,
      zip: this.mgaForm.zip || null,
      city: this.mgaForm.city || null,
      state: this.mgaForm.state || null,
      phone: this.mgaForm.phone || null,
      open_item: this.mgaForm.open_item,
      op_start_date: this.mgaForm.op_start_date || null,
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
    this.service.getProducts(undefined, true).subscribe(res => {
      this.productOptions = res;
      this.cdr.markForCheck();
    });
    this.service.getTreatyTypes(undefined, true).subscribe(res => {
      this.treatyTypeOptions = res;
      this.cdr.markForCheck();
    });
  }

  openTreatyAdd(mgaId?: string): void {
    this.isEditMode = false;
    this.treatyModalTitle = 'Create Treaty';
    this.loadTreatyOptions();

    this.treatyForm = createBlankTreatyForm();
    if (mgaId) {
      this.treatyForm.mga_id = mgaId;
    }

    this.treatySelectedStates = {};
    this.treatySelectedProducts = {};
    this.showTreatyModal = true;
  }

  openTreatyEdit(treaty: Treaty): void {
    this.isEditMode = true;
    this.treatyModalTitle = `Edit Treaty: ${treaty.treaty_code}`;
    this.loadTreatyOptions();

    const reinsurers: TreatyReinsurer[] = treaty.treaty_reinsurers
      ? treaty.treaty_reinsurers.map(tr => ({
          reinsurer_id: tr.reinsurer_id,
          quota_share: tr.quota_share,
        }))
      : [];

    this.treatyForm = {
      id: treaty.id,
      treaty_code: treaty.treaty_code,
      name: treaty.name,
      mga_id: treaty.mga_id,
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
      treaty_type_id: treaty.treaty_type_id,
      carrier_allocation_type: treaty.carrier_allocation_type,
      ulae_type: treaty.ulae_type,
      ulae_basis: treaty.ulae_basis,
      ulae_flat_amount: treaty.ulae_flat_amount,
      state_ids: [],
      products: [],
      carriers: [],
      reinsurers,
    };

    // Prepopulate selections
    this.treatySelectedStates = {};
    if (treaty.treaty_states) {
      treaty.treaty_states.forEach(ts => {
        this.treatySelectedStates[ts.state_id] = true;
      });
    }

    this.treatySelectedProducts = {};
    if (treaty.treaty_products) {
      treaty.treaty_products.forEach(tp => {
        this.treatySelectedProducts[tp.product_id] = true;
      });
    }

    this.showTreatyModal = true;
  }

  submitTreaty(event: TreatySaveEvent): void {
    this.treatyForm = event.form;
    this.treatySelectedStates = event.selectedStates;
    this.treatySelectedProducts = event.selectedProducts;

    if (!this.treatyForm.treaty_code || !this.treatyForm.name || !this.treatyForm.mga_id) {
      this.toast.error('Treaty Code, Name and MGA Underwriter are required');
      return;
    }
    this.submitting = true;

    // Build state_ids
    const state_ids = Object.keys(this.treatySelectedStates).filter(
      k => this.treatySelectedStates[k],
    );

    // Build products from selection
    const products = Object.keys(this.treatySelectedProducts)
      .filter(k => this.treatySelectedProducts[k])
      .map(product_id => ({ product_id }));

    const reinsurers = (this.treatyForm.reinsurers || []).filter(r => r.reinsurer_id);

    const payload = {
      treaty_code: this.treatyForm.treaty_code,
      name: this.treatyForm.name,
      mga_id: this.treatyForm.mga_id,
      risk_company_id: this.treatyForm.risk_company_id,
      effective_date: this.treatyForm.effective_date || null,
      expiration_date: this.treatyForm.expiration_date || null,
      qs_pct: this.treatyForm.qs_pct,
      cf_pct: this.treatyForm.cf_pct,
      comm_pct: this.treatyForm.comm_pct,
      bb_pct: this.treatyForm.bb_pct,
      ulae_pct: this.treatyForm.ulae_pct,
      xol_pct: this.treatyForm.xol_pct,
      lr_cap_pct: this.treatyForm.lr_cap_pct,
      ibnr_pct: this.treatyForm.ibnr_pct,
      lae_dcc_pct: this.treatyForm.lae_dcc_pct,
      lae_aoe_pct: this.treatyForm.lae_aoe_pct,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null
      treaty_type_id: this.treatyForm.treaty_type_id || null,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null
      carrier_allocation_type: this.treatyForm.carrier_allocation_type || null,
      ulae_type: this.treatyForm.ulae_type,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null
      ulae_basis: this.treatyForm.ulae_basis || null,
      ulae_flat_amount: this.treatyForm.ulae_flat_amount,
      state_ids,
      products,
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
    if (treaty.risk_company) {
      return treaty.risk_company.name;
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

  getProductsListDisplay(products?: TreatyProduct[]): string {
    if (!products || products.length === 0) return '-';
    return products
      .map(p => p.product?.name ?? p.product_id)
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
      case 'treaty-type':
        return 'Treaty Type';
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
      case 'broker':
        return 'broker_code';
      case 'product':
        return 'product_code';
      case 'document-type':
        return 'type_code';
      case 'sequence-prefix-counter':
        return 'sequence_type';
      case 'treaty-type':
        return 'type_code';
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
        headers = ['Code', 'Treaty Name', 'MGA', 'Risk Company', 'States', 'Products', 'Status'];
        rows = this.treaties.map(t => [
          t.treaty_code,
          t.name,
          this.getMgasListDisplay(t),
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          t.risk_company?.name || '-',
          this.getStatesListDisplay(t.treaty_states),
          this.getProductsListDisplay(t.treaty_products),
          t.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'treaties.csv';
        break;

      case 'mgas':
        headers = ['MGA Code', 'MGA Name', 'Ledger Amount', 'Status'];
        rows = this.mgas.map(m => [
          m.mga_code,
          m.name,
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
        headers = ['Type Code', 'Name', 'Description', 'Status'];
        rows = this.documentTypes.map(d => [
          d.type_code,
          d.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          d.description || '-',
          d.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'document_types.csv';
        break;

      case 'sequence-prefix-counters':
        headers = [
          'Sequence Type',
          'Name',
          'Prefix',
          'Next Number',
          'Seq Start',
          'Description',
          'Status',
        ];
        rows = this.sequencePrefixMasters.map(s => [
          s.sequence_type,
          s.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.prefix || '-',
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.next_number !== undefined ? s.next_number : 1,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.seq_start !== undefined ? s.seq_start : 1,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          s.description || '-',
          s.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'sequence_prefix_masters.csv';
        break;

      case 'treaty-types':
        headers = ['Type Code', 'Name', 'Description', 'Status'];
        rows = this.treatyTypes.map(t => [
          t.type_code,
          t.name,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          t.description || '-',
          t.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'treaty_types.csv';
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

  saveManualITD(formValue: ItdFormValue): void {
    this.itdForm.program = formValue.program;
    this.itdForm.month_key = formValue.month_key;
    this.itdForm.month_label = formValue.month_label;
    this.itdForm.exhibits = formValue.exhibits;

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
}
