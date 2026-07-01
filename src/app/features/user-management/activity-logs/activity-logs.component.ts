import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PaginationComponent } from '../../../shared/ui/pagination/pagination.component';
import { SearchInputComponent } from '../../../shared/ui/search-input/search-input.component';
import { ActivityLog, ActivityLogsFilter } from '../../../core/models/activity-log.model';
import { Module } from '../../../core/models/permission.model';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityLogsService } from '../../../core/services/activity-logs.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

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
  imports: [FormsModule, RouterLink, RouterLinkActive, PaginationComponent, SearchInputComponent],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.scss',
})
export class ActivityLogsComponent implements OnInit {
  private authService = inject(AuthService);
  private logsService = inject(ActivityLogsService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  logs: ActivityLog[] = [];
  loading = false;
  modules: Module[] = [];
  skeletonRows = [1, 2, 3, 4, 5, 6, 7];

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

  ngOnInit(): void {
    this.loadLogs();
    this.loadModules();
  }

  loadModules(): void {
    this.permissionsService.getModules().subscribe({
      next: mods => {
        this.modules = mods;
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

  onSearchInput(term: string): void {
    this.filter.search = term;
    this.filter.page = 1;
    this.currentPage = 1;
    this.loadLogs();
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
