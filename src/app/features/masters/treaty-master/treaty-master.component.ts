import {
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../../shared/components/dropdown-search/dropdown-search.component';
import { ReinsuranceService } from '../../../core/services/reinsurance.service';
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
} from '../../../core/models/master.model';

@Component({
  selector: 'app-treaty-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    ConfirmDialogComponent,
    DropdownSearchComponent,
  ],
  templateUrl: './treaty-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreatyMasterComponent implements OnInit {
  @Input() isActive = false;
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';
  @Input() mgaFilter = 'all';
  @Input() mgaOptions: MgaMaster[] = [];

  @ViewChild('monthlyExcelInput') monthlyExcelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('itdExcelInput') itdExcelInput!: ElementRef<HTMLInputElement>;

  private service = inject(MastersService);
  private reinsuranceService = inject(ReinsuranceService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  mgaLabelFn = (item: any) => (item ? `${item.name} (${item.mga_code})` : '');
  riskCompanyLabelFn = (item: any) => (item ? `${item.name} (${item.risk_company_id})` : '');
  reinsurerLabelFn = (item: any) => (item ? `${item.name} (${item.reinsurer_company_id})` : '');
  stateLabelFn = (item: any) => (item ? `${item.state_code} - ${item.name}` : '');
  lobLabelFn = (item: any) => (item ? `${item.name} (${item.lob_code})` : '');
  cobLabelFn = (item: any) => (item ? `${item.name} (${item.cob_code})` : '');
  brokerLabelFn = (item: any) => item.name || '';

  // Data
  treaties: Treaty[] = [];
  seededProgramITD = new Set<string>();
  itdWorkbookIds = new Map<string, number>();
  treatyWorkbookStatuses = new Map<string, string>();

  // Pagination
  pageSize = 25;
  currentPage = 1;

  loading = false;
  isEditMode = false;
  submitting = false;

  // Treaty form dropdown options
  reinsurerOptions: ReinsurerCompany[] = [];
  riskCompanyOptions: RiskCompany[] = [];
  stateOptions: StateMaster[] = [];
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];
  brokerOptions: any[] = [];
  localMgaOptions: MgaMaster[] = [];

  // Treaty UI selectors
  treatySelectedStates: { [stateId: string]: boolean } = {};
  treatySelectedMgas: { [mgaId: string]: boolean } = {};
  treatySelectedLobs: { [lobId: string]: boolean } = {};
  treatySelectedCobs: { [cobId: string]: boolean } = {};
  treatyLobCobs: { [lobId: string]: { [cobId: string]: boolean } } = {};

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

  // ITD Modal
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
      lae_aoe: 7,
    },
    exhibits: {},
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
    { value: '12', label: 'December' },
  ];
  yearsList = [
    '2020', '2021', '2022', '2023', '2024', '2025',
    '2026', '2027', '2028', '2029', '2030',
  ];

  // Upload
  selectedTreatyForUpload: any = null;

  // Confirm dialog
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  get columnDefs(): ColDef[] {
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
        cellRenderer: ActionButtonsCellRenderer,
        cellRendererParams: {
          buttons: (data: any) => {
            const btns = [];
            if (this.hasITDSeeded(data.name)) {
              btns.push({ label: 'Upload Excel', action: 'uploadExcel' });
            }
            btns.push({ label: 'Upload ITD', action: 'uploadItd' });
            btns.push({ label: 'Manual ITD', action: 'manualItd' });
            btns.push({ label: 'Edit', action: 'edit' });
            btns.push({ label: 'Delete', action: 'delete', danger: true });
            return btns;
          },
          onClick: (action: string, data: any) => {
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
  }

  get currentList(): any[] {
    let list = this.treaties;
    if (this.mgaFilter && this.mgaFilter !== 'all') {
      list = list.filter(
        t =>
          t.mga_id === this.mgaFilter ||
          (t.treaty_mgas && t.treaty_mgas.some(tm => tm.mga_id === this.mgaFilter)),
      );
    }
    return list;
  }

  get paginatedItems(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.currentList.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.currentList.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  ngOnInit(): void {
    this.loadData();
  }

  load(searchTerm: string, statusFilter: 'all' | 'active' | 'inactive', mgaFilter: string): void {
    this.searchTerm = searchTerm;
    this.statusFilter = statusFilter;
    this.mgaFilter = mgaFilter;
    this.currentPage = 1;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();

    const search = this.searchTerm || undefined;
    const active =
      this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined;

    this.reinsuranceService.getWorkbooks().subscribe({
      next: wbs => {
        this.seededProgramITD.clear();
        this.itdWorkbookIds.clear();
        this.treatyWorkbookStatuses.clear();
        wbs.forEach(wb => {
          if (wb.source === 'ITD') {
            this.seededProgramITD.add(wb.program);
            this.itdWorkbookIds.set(wb.program, wb.id);
          }
          const progName = (wb.program || '').trim();
          const existing = this.treatyWorkbookStatuses.get(progName);
          if (existing !== 'Approved') {
            this.treatyWorkbookStatuses.set(progName, wb.status || 'Pending');
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
  }

  loadTreatyOptions(): void {
    this.service.getMgas(undefined, true).subscribe(res => {
      this.localMgaOptions = res;
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

  openAdd(mgaId?: string): void {
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
    this.cdr.markForCheck();
  }

  openTreatyEdit(treaty: Treaty): void {
    this.isEditMode = true;
    this.treatyModalTitle = `Edit Treaty: ${treaty.treaty_code}`;
    this.loadTreatyOptions();

    let carriers: any[] = [];
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
      carriers = [{ risk_company_id: '', retention_pct: 100 }];
    }

    let reinsurers: any[] = [];
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
    this.cdr.markForCheck();
  }

  submitTreaty(): void {
    if (!this.treatyForm.treaty_code || !this.treatyForm.name || !this.treatyForm.mga_id) {
      this.toast.error('Treaty Code, Name and MGA Underwriter are required');
      return;
    }
    this.submitting = true;
    const mga_ids = [this.treatyForm.mga_id];

    const state_ids = Object.keys(this.treatySelectedStates).filter(
      k => this.treatySelectedStates[k],
    );

    const selectedLobIds = Object.keys(this.treatySelectedLobs).filter(
      lobId => this.treatySelectedLobs[lobId],
    );
    const selectedCobIds = Object.keys(this.treatySelectedCobs).filter(
      cobId => this.treatySelectedCobs[cobId],
    );

    const lobs = selectedLobIds.map(lobId => ({
      lob_id: lobId,
      cob_ids: selectedCobIds,
    }));

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
      reinsurers,
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
        this.cdr.markForCheck();
      },
      error: (err: any) => {
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
    this.treatyForm.carriers.push({ risk_company_id: '', retention_pct: 100 });
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
    this.treatyForm.reinsurers.push({ reinsurer_id: '', cession_pct: 0 });
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
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete treaty');
        },
      });
    };
    this.confirmOpen = true;
    this.cdr.markForCheck();
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

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.markForCheck();
    }
  }

  exportToExcel(): void {
    const headers = ['Code', 'Treaty Name', 'MGA', 'Risk Company', 'States', 'LOBs (COBs)', 'Status'];
    const rows = this.treaties.map(t => [
      t.treaty_code,
      t.name,
      this.getMgasListDisplay(t),
      t.risk_company?.name || '-',
      this.getStatesListDisplay(t.treaty_states),
      this.getLobsListDisplay(t.treaty_lobs),
      t.is_active ? 'Active' : 'Inactive',
    ]);
    this.downloadCSV(headers, rows, 'treaties.csv');
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
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

  getMgasListDisplay(treaty: Treaty): string {
    if (treaty.treaty_mgas && treaty.treaty_mgas.length > 0) {
      return treaty.treaty_mgas
        .map(m => m.mga?.name)
        .filter(Boolean)
        .join(', ');
    }
    return treaty.mga?.name || '-';
  }

  getCarriersListDisplay(treaty: Treaty): string {
    if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
      return treaty.treaty_carriers
        .map(tc => `${tc.risk_company?.name || 'Unknown'} (${tc.retention_pct}%)`)
        .join(', ');
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

  hasITDSeeded(programName: string): boolean {
    return this.seededProgramITD.has((programName || '').trim());
  }

  getTreatyStatus(programName?: string): string {
    if (!programName) return 'Draft';
    return this.treatyWorkbookStatuses.get(programName) || 'Pending';
  }

  triggerTreatyMonthlyUpload(treaty: any): void {
    this.selectedTreatyForUpload = treaty;
    if (this.monthlyExcelInput?.nativeElement) {
      this.monthlyExcelInput.nativeElement.click();
    }
  }

  triggerTreatyITDUpload(treaty: any): void {
    this.selectedTreatyForUpload = treaty;
    if (this.itdExcelInput?.nativeElement) {
      this.itdExcelInput.nativeElement.click();
    }
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
        error: err => {
          const msg = err.error?.message || 'Failed to upload monthly exhibit';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
        },
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
          this.toast.success(
            `ITD baseline reserves uploaded and seeded for ${programName} successfully.`,
          );
          this.selectedTreatyForUpload = null;
          event.target.value = '';
          this.loadData();
        },
        error: err => {
          const msg = err.error?.message || 'Failed to seed ITD baseline';
          this.toast.error(msg);
          this.selectedTreatyForUpload = null;
          event.target.value = '';
        },
      });
    }
  }

  onItdMonthYearChange(): void {
    const monthObj = this.monthsList.find(m => m.value === this.itdSelectedMonth);
    const monthLabel = monthObj ? monthObj.label : 'December';
    this.itdForm.month_key = `${this.itdSelectedYear}-${this.itdSelectedMonth}`;
    this.itdForm.month_label = `${monthLabel} ${this.itdSelectedYear}`;
  }

  openAddItdModal(treaty: any): void {
    this.selectedTreatyForItd = treaty;
    this.itdForm.program = treaty.name;
    this.itdSelectedMonth = '12';
    this.itdSelectedYear = '2025';
    this.itdForm.month_key = '2025-12';
    this.itdForm.month_label = 'December 2025';

    const states = (treaty.treaty_states || [])
      .map((s: any) => {
        const code = s.state?.state_code || s.state_code;
        const abbr = s.state?.state_abbr || s.state_code;
        return { code: String(code), label: String(abbr) };
      })
      .filter((s: any) => s.code);

    this.itdStatesList = [
      { code: 'TOTAL', label: 'TOTAL' },
      ...states
        .filter((s: any) => s.code !== 'TOTAL')
        .sort((a: any, b: any) => a.label.localeCompare(b.label)),
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
          const exhibits = wbDetail.stateExhibits || wbDetail.state_exhibits || [];

          const getVal = (val: any) => {
            if (Array.isArray(val)) return Number(val[val.length - 1] || 0);
            return Number(val || 0);
          };

          for (const se of exhibits) {
            const stateCode = String(se.stateCode || se.state_code);
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
        uep: Number(ex.uep || 0),
        loss_reserves: Number(ex.loss_reserves || 0),
        loss_ibnr: Number(ex.loss_ibnr || 0),
        lae_reserves_dcc: Number(ex.lae_reserves_dcc || 0),
        lae_ibnr_dcc: Number(ex.lae_ibnr_dcc || 0),
        lae_reserves_aoe: Number(ex.lae_reserves_aoe || 0),
        lae_ibnr_aoe: Number(ex.lae_ibnr_aoe || 0),
        ulae_ibnr: Number(ex.ulae_ibnr || 0),
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
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to save manual ITD baseline');
      },
    });
  }
}
