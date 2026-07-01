import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ActivityLog, ActivityLogsFilter } from '../../../core/models/activity-log.model';
import { Module } from '../../../core/models/permission.model';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityLogsService } from '../../../core/services/activity-logs.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, ColDef } from 'ag-grid-community';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { AvatarCellRenderer } from '../../../shared/components/grid-renderers/avatar-cell.component';

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  login: { bg: 'var(--blue-bg)', text: 'var(--blue)' },
  logout: { bg: 'var(--gray-200)', text: 'var(--gray-600)' },
  create: { bg: 'var(--green-bg)', text: 'var(--green)' },
  update: { bg: 'var(--orange-bg)', text: 'var(--orange)' },
  delete: { bg: 'var(--red-bg)', text: 'var(--red)' },
};

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [FormsModule, RouterLink, RouterLinkActive, AgGridAngular],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
})
export class ActivityLogsComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  private authService = inject(AuthService);
  private logsService = inject(ActivityLogsService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  logs: ActivityLog[] = [];
  loading = false;
  modules: Module[] = [];
  skeletonRows = [1, 2, 3, 4, 5, 6, 7];

  gridOptions!: GridOptions;
  columnDefs: ColDef[] = [];

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
  }

  setupGrid(): void {
    this.gridOptions = {
      ...this.agGridConfig.getDefaultGridOptions(),
      pagination: false // Using external pagination
    };

    this.columnDefs = [
      {
        headerName: 'USER',
        field: 'user',
        cellRenderer: AvatarCellRenderer,
        minWidth: 250,
        flex: 2,
        valueGetter: params => {
          if (params.data?.user) return params.data.user;
          return { name: 'System', initials: 'SY', avatar_color: '#94a3b8' };
        }
      },
      {
        headerName: 'ACTION',
        field: 'action',
        cellRenderer: (params: any) => {
          const action = params.value;
          const style = this.getActionStyle(action);
          return `<span class="action-badge" style="background: ${style.bg}; color: ${style.text}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;">${action}</span>`;
        },
        flex: 1, minWidth: 120
      },
      {
        headerName: 'MODULE',
        field: 'module_id',
        valueFormatter: params => this.formatModule(params.value),
        flex: 1, minWidth: 150
      },
      {
        headerName: 'ENTITY',
        field: 'entity_type',
        valueFormatter: params => params.value || '-',
        flex: 1, minWidth: 150
      },
      {
        headerName: 'DESCRIPTION',
        field: 'description',
        valueFormatter: params => params.value || '-',
        flex: 2,
        minWidth: 200
      },
      {
        headerName: 'IP ADDRESS',
        field: 'ip_address',
        valueFormatter: params => params.value || '-',
        cellClass: 'text-mono',
        flex: 1, minWidth: 150
      },
      {
        headerName: 'DATE / TIME',
        field: 'created_at',
        valueFormatter: params => this.formatDate(params.value),
        flex: 1, minWidth: 160
      }
    ];
  }

  loadModules(): void {
    this.permissionsService.getModules().subscribe({
      next: mods => {
        this.modules = mods;
        // need to refresh grid if it's already rendered, since modules are loaded async
        if (this.agGrid?.api) {
          this.agGrid.api.refreshCells({ force: true });
        }
        this.cdr.markForCheck();
      }
    });
  }

  loadLogs(): void {
    this.loading = true;
    this.logsService.getLogs({
      ...this.filter,
      search: this.filter.search || undefined,
      action: this.filter.action || undefined,
      module_id: this.filter.module_id || undefined,
      date_from: this.filter.date_from || undefined,
      date_to: this.filter.date_to || undefined,
    }).subscribe({
      next: (result) => {
        this.logs = result.data;
        this.total = result.total;
        this.totalPages = result.total_pages;
        this.currentPage = result.page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load activity logs');
        this.cdr.markForCheck();
      }
    });
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
    this.logsService.exportLogs({
      search: this.filter.search || undefined,
      action: this.filter.action || undefined,
      module_id: this.filter.module_id || undefined,
      date_from: this.filter.date_from || undefined,
      date_to: this.filter.date_to || undefined,
    }).subscribe({
      next: (blob) => {
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
      }
    });
  }

  getActionStyle(action: string): { bg: string; text: string } {
    return ACTION_COLORS[action.toLowerCase()] ?? { bg: 'rgba(13,27,75,0.08)', text: 'var(--navy)' };
  }

  formatModule(moduleId?: string): string {
    if (!moduleId) return '-';
    const mod = this.modules.find(m => m.id === moduleId);
    return mod?.label ?? moduleId;
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
