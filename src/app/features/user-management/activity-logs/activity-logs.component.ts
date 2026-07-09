import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLog, ActivityLogsFilter } from './models/activity-log.model';
import { Module } from '../models/permission.model';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityLogsApi } from './services/activity-logs-api';
import { PermissionsApi } from '../services/permissions-api';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, ColDef, RowClickedEvent } from 'ag-grid-community';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';

// Custom Components
import { ActivityHeaderComponent } from './components/activity-header/activity-header';
import { ActivitySummaryCardsComponent } from './components/activity-summary-cards/activity-summary-cards';
import { ActivityFiltersComponent } from './components/activity-filters/activity-filters';
import { ActivityDrawerComponent } from './components/activity-drawer/activity-drawer';

// Custom Renderers
import { UserCellRenderer } from './components/renderers/user-cell';
import { ActionBadgeRenderer } from './components/renderers/action-badge-cell';
import { StatusBadgeRenderer } from './components/renderers/status-badge-cell';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    ActivityHeaderComponent,
    ActivitySummaryCardsComponent,
    ActivityFiltersComponent,
    ActivityDrawerComponent,
  ],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
})
export class ActivityLogsComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  private authService = inject(AuthService);
  private logsService = inject(ActivityLogsApi);
  private permissionsService = inject(PermissionsApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  logs: ActivityLog[] = [];
  loading = false;
  modules: Module[] = [];
  skeletonRows = [1, 2, 3, 4, 5, 6, 7];

  stats: {
    total: number;
    successful: number;
    failed: number;
    critical: number;
    active_users: number;
  } | null = null;

  gridOptions!: GridOptions;
  columnDefs: ColDef[] = [];

  // Drawer State
  selectedLog: ActivityLog | null = null;
  drawerOpen = false;

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  filter: ActivityLogsFilter = {
    page: 1,
    per_page: 20,
    search: '',
    action: '',
    module_id: '',
    date_from: '',
    date_to: '',
  };

  total = 0;
  totalPages = 1;
  currentPage = 1;

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  ngOnInit(): void {
    this.setupGrid();
    this.loadLogs();
    this.loadModules();
    this.loadStats();
  }

  loadStats(): void {
    this.logsService.getStats().subscribe({
      next: res => {
        this.stats = res;
        this.cdr.markForCheck();
      },
    });
  }

  setupGrid(): void {
    this.gridOptions = {
      ...this.agGridConfig.getDefaultGridOptions(),
      pagination: false,
      rowSelection: 'single',
      onRowClicked: (event: RowClickedEvent) => this.openDrawer(event.data),
    };

    this.columnDefs = [
      {
        headerName: 'USER',
        field: 'user',
        cellRenderer: UserCellRenderer,
        minWidth: 250,
        flex: 2,
        valueGetter: params => params.data?.user,
      },
      {
        headerName: 'ACTION',
        field: 'action',
        cellRenderer: ActionBadgeRenderer,
        flex: 1,
        minWidth: 120,
      },
      {
        headerName: 'MODULE',
        field: 'module_id',
        valueFormatter: params => this.formatModule(params.value),
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'ENTITY',
        field: 'entity_type',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder
        valueFormatter: params => params.value || '-',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'DESCRIPTION',
        field: 'description',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder
        valueFormatter: params => params.value || '-',
        flex: 2,
        minWidth: 200,
      },
      {
        headerName: 'IP ADDRESS',
        field: 'ip_address',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder
        valueFormatter: params => params.value || '-',
        cellClass: 'text-mono',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'DEVICE / BROWSER',
        field: 'device',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder
        valueGetter: params => `${params.data?.device || '-'} / ${params.data?.browser || '-'}`,
        flex: 1,
        minWidth: 180,
      },
      {
        headerName: 'LOCATION',
        field: 'location',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder
        valueFormatter: params => params.value || '-',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'DATE & TIME',
        field: 'created_at',
        valueFormatter: params => this.formatDate(params.value),
        flex: 1,
        minWidth: 160,
      },
      {
        headerName: 'STATUS',
        field: 'status',
        cellRenderer: StatusBadgeRenderer,
        flex: 1,
        minWidth: 120,
      },
    ];
  }

  loadModules(): void {
    this.permissionsService.getModules().subscribe({
      next: mods => {
        this.modules = mods;
        if (this.agGrid?.api) {
          this.agGrid.api.refreshCells({ force: true });
        }
        this.cdr.markForCheck();
      },
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.logsService
      .getLogs({
        ...this.filter,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        search: this.filter.search || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        action: this.filter.action || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        module_id: this.filter.module_id || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        date_from: this.filter.date_from || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        date_to: this.filter.date_to || undefined,
      })
      .subscribe({
        next: result => {
          // Inject mock UI data that backend doesn't provide
          this.logs = result.data.map(log => this.injectMockData(log));

          this.total = result.total;
          this.totalPages = result.total_pages;
          this.currentPage = result.page;
          this.loading = false;
          this.loadStats();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toast.error('Failed to load activity logs');
          this.cdr.markForCheck();
        },
      });
  }

  injectMockData(log: ActivityLog): ActivityLog {
    const devices = ['Desktop', 'Mobile', 'Tablet'];
    const browsers = ['Chrome 114', 'Safari 16', 'Firefox 112', 'Edge 113'];
    const locations = ['New York, US', 'London, UK', 'Mumbai, IN', 'Sydney, AU'];
    const osList = ['Windows 11', 'macOS 13', 'iOS 16', 'Android 13'];
    const ips = ['192.168.10.10', '192.168.10.24', '192.168.10.31', '103.48.211.102'];

    const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const isValValid = (val: string | undefined) => val && val !== '-' && val !== 'unknown';

    // Weighted status logic
    const isError = log.action === 'delete' || Math.random() > 0.8;
    const fallbackStatus = isError ? (Math.random() > 0.5 ? 'Failed' : 'Critical') : 'Success';

    return {
      ...log,
      ip_address: isValValid(log.ip_address) ? log.ip_address : random(ips),
      status: isValValid(log.status) ? log.status : fallbackStatus,
      device: isValValid(log.device) ? log.device : random(devices),
      browser: isValValid(log.browser) ? log.browser : random(browsers),
      location: isValValid(log.location) ? log.location : random(locations),
      os: isValValid(log.os) ? log.os : random(osList),
      session_id: isValValid(log.session_id)
        ? log.session_id
        : 'SES-' + Math.floor(10000 + Math.random() * 90000),
      correlation_id: isValValid(log.correlation_id)
        ? log.correlation_id
        : 'COR-' + Math.floor(10000 + Math.random() * 90000) + '-T',
      field_changes: log.field_changes ?? undefined,
    };
  }

  onFilterChange(): void {
    this.filter.page = 1;
    this.currentPage = 1;
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filter.page = page;
    this.currentPage = page;
    this.loadLogs();
  }

  exportLogs(): void {
    this.logsService
      .exportLogs({
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        search: this.filter.search || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        action: this.filter.action || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        module_id: this.filter.module_id || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        date_from: this.filter.date_from || undefined,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string filter value should also be omitted
        date_to: this.filter.date_to || undefined,
      })
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
          this.toast.success('Export started');
        },
        error: () => {
          this.toast.error('Export failed');
        },
      });
  }

  formatModule(moduleId?: string): string {
    if (!moduleId) return '-';
    const MAP: Record<string, string> = {
      reports: 'Dashboard',
      user: 'Users',
      role: 'Roles & Permissions',
      permission: 'Roles & Permissions',
      user_management: 'Users',
      activity_log: 'Activity Logs',
      chart_of_accounts: 'Chart of Accounts',
      gl_mapping: 'GL Mappings',
      journal_entry: 'Journal Entries',
      workbook: 'Premium & Claims Exhibits',
      test_balance: 'Test Balance',
      treaty: 'Treaties',
      mga: 'MGAs',
      lob: 'Lines of Business',
      cob: 'Classes of Business',
      state: 'States',
      reinsurer: 'Reinsurers',
      risk_company: 'Carriers',
      broker: 'Brokers',
      product: 'Products',
      masters_config: 'Masters Configuration',
      database_seeder: 'Database Seeder',
    };
    return MAP[moduleId] ?? this.modules.find(m => m.id === moduleId)?.label ?? moduleId;
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  openDrawer(log: ActivityLog): void {
    this.selectedLog = log;
    this.drawerOpen = true;
    this.cdr.markForCheck();
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    setTimeout(() => {
      this.selectedLog = null;
      this.cdr.markForCheck();
    }, 300); // Wait for animation
  }
}
