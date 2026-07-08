import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { User, UserStats, PendingInvite, PanelMode } from '../models/user.model';
import { Role } from '../models/role.model';
import { AuthService } from '../../../core/services/auth.service';
import { UsersApi } from '../services/users-api';
import { RolesApi } from '../services/roles-api';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { UsersTableComponent } from './users-table/users-table.component';
import { InvitePanelComponent } from './invite-panel/invite-panel.component';
import { UserDetailPanelComponent } from './user-detail-panel/user-detail-panel.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    FormsModule,
    UsersTableComponent,
    InvitePanelComponent,
    UserDetailPanelComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersApi);
  private rolesService = inject(RolesApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  users: User[] = [];
  roles: Role[] = [];
  pendingInvites: PendingInvite[] = [];
  stats: UserStats | null = null;
  loading = false;

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  selectedIds: string[] = [];

  currentPage = 1;
  perPage = 20;
  total = 0;
  totalPages = 1;

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  invitePanelOpen = false;
  detailPanelOpen = false;
  selectedUser: User | null = null;
  detailMode: PanelMode = PanelMode.View;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  viewDropdownOpen = false;

  get currentViewName(): string {
    if (!this.roleFilter) return 'All Users';
    const role = this.roles.find(r => r.id === this.roleFilter);
    return role ? role.label : 'All Users';
  }

  selectView(roleId: string): void {
    this.roleFilter = roleId;
    this.viewDropdownOpen = false;
    this.onFilterChange();
  }

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadRoles();
    this.loadPendingInvites();

    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  loadStats(): void {
    this.usersService.getStats().subscribe({
      next: s => {
        this.stats = s;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService
      .getUsers({
        page: this.currentPage,
        per_page: this.perPage,
        search: this.searchTerm || undefined,
        role_id: this.roleFilter || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: result => {
          this.users = result.data;
          this.total = result.total;
          this.totalPages = result.total_pages;
          this.currentPage = result.page;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toast.error('Failed to load users');
          this.cdr.markForCheck();
        },
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  loadRoles(): void {
    this.rolesService.getRoles({ per_page: 100 }).subscribe({
      next: result => {
        this.roles = result.data;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  loadPendingInvites(): void {
    this.usersService.getPendingInvites().subscribe({
      next: invites => {
        this.pendingInvites = invites;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onViewUser(user: User): void {
    this.selectedUser = user;
    this.detailMode = PanelMode.View;
    this.detailPanelOpen = true;
  }

  onEditUser(user: User): void {
    this.selectedUser = user;
    this.detailMode = PanelMode.Edit;
    this.detailPanelOpen = true;
  }

  onDeactivateUser(user: User): void {
    this.confirmTitle = 'Deactivate User';
    this.confirmMessage = `Are you sure you want to deactivate ${user.name}? They will lose access immediately.`;
    this.pendingAction = () => {
      this.usersService.deactivateUser(user.id).subscribe({
        next: () => {
          this.toast.success(`${user.name} has been deactivated`);
          this.loadUsers();
          this.loadStats();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Failed to deactivate user');
        },
      });
    };
    this.confirmOpen = true;
  }

  onSelectionChanged(ids: string[]): void {
    this.selectedIds = ids;
  }

  clearSelection(): void {
    this.selectedIds = [];
  }

  openBulkDeactivate(): void {
    this.confirmTitle = 'Deactivate Selected Users';
    this.confirmMessage = `Deactivate ${this.selectedIds.length} selected user(s)? They will lose access immediately.`;
    this.pendingAction = () => {
      this.usersService.deactivateBulk(this.selectedIds).subscribe({
        next: res => {
          this.toast.success(`${res.count} user(s) deactivated`);
          this.selectedIds = [];
          this.loadUsers();
          this.loadStats();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Failed to deactivate users');
        },
      });
    };
    this.confirmOpen = true;
  }

  onConfirmed(): void {
    this.confirmOpen = false;
    this.pendingAction?.();
    this.pendingAction = null;
  }

  onInvited(): void {
    this.loadUsers();
    this.loadPendingInvites();
    this.loadStats();
  }

  onUserUpdated(user: User): void {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.users[idx] = user;
      this.users = [...this.users];
    }
    this.loadStats();
    this.cdr.markForCheck();
  }

  onRevokeInvite(id: string): void {
    this.usersService.revokeInvite(id).subscribe({
      next: () => {
        this.toast.success('Invitation revoked');
        this.loadPendingInvites();
        this.loadStats();
      },
      error: () => {
        this.toast.error('Failed to revoke invitation');
      },
    });
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  hexToRgba(hex: string | null | undefined, alpha: number): string {
    if (!hex || hex.length < 7) return `rgba(13,27,75,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  exportToExcel(): void {
    const headers = ['Name', 'Email', 'Role', 'Status'];
    const rows = this.users.map(u => [
      u.name || '',
      u.email,
      u.role?.label ?? '-',
      u.status || '-',
    ]);

    this.downloadCSV(headers, rows, 'users.csv');
  }

  private downloadCSV(headers: string[], rows: (string | number)[][], filename: string): void {
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.view-dropdown-wrapper')) {
      this.viewDropdownOpen = false;
    }
  }
}
