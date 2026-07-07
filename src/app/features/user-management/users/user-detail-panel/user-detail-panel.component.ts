import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../models/user.model';
import { Permission } from '../../models/permission.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersApi } from '../../services/users-api';
import { PermissionsApi } from '../../services/permissions-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UserStatusBadgeComponent } from '../user-status-badge/user-status-badge.component';

import { Role } from '../../models/role.model';

interface UpdateUserProfilePayload {
  status: 'active' | 'inactive' | 'pending';
  name?: string;
  role_id?: string;
  department?: string | null;
  title?: string | null;
  initials?: string | null;
}

@Component({
  selector: 'app-user-detail-panel',
  standalone: true,
  imports: [FormsModule, UserStatusBadgeComponent],
  templateUrl: './user-detail-panel.component.html',
  styleUrl: './user-detail-panel.component.scss',
})
export class UserDetailPanelComponent implements OnChanges {
  @Input() user: User | null = null;
  @Input() open = false;
  @Input() roles: Role[] = [];
  @Input() mode: 'view' | 'edit' = 'view';
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  private authService = inject(AuthService);
  private usersService = inject(UsersApi);
  private permissionsService = inject(PermissionsApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'profile' | 'permissions' = 'profile';
  editStatus: 'active' | 'inactive' | 'pending' = 'active';
  editName = '';
  editRoleId = '';
  editDepartment = '';
  editTitle = '';

  allPermissions: Permission[] = [];
  selectedIds = new Set<string>();

  get groupedPermissions(): { moduleName: string; permissions: Permission[] }[] {
    const groups: Record<string, Permission[]> = {};
    for (const perm of this.allPermissions) {
      const parts = perm.action.split('.');
      const prefix = parts.length > 1 ? parts[0] : 'general';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(perm);
    }
    const MODULE_NAMES: Record<string, string> = {
      activity_log: 'Activity Logs',
      permission: 'Permissions',
      role: 'Roles',
      user: 'Users',
      user_management: 'User Management',
      chart_of_accounts: 'Chart of Accounts',
      master_data: 'Master Data',
      journal_entry: 'Journal Entries',
      reinsurance: 'Premium and claims Exhibits',
      general: 'General',
    };
    return Object.entries(groups)
      .map(([prefix, perms]) => ({
        moduleName:
          MODULE_NAMES[prefix] ||
          prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/_/g, ' '),
        permissions: perms,
      }))
      .sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  }

  expandedGroups = new Set<string>();

  toggleGroup(groupName: string): void {
    if (this.expandedGroups.has(groupName)) {
      this.expandedGroups.delete(groupName);
    } else {
      this.expandedGroups.add(groupName);
    }
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups.has(groupName);
  }

  isAllSelected(group: { moduleName: string; permissions: Permission[] }): boolean {
    if (!group.permissions.length) return false;
    return group.permissions.every(perm => this.selectedIds.has(perm.id));
  }

  toggleSelectAllGroup(group: { moduleName: string; permissions: Permission[] }): void {
    const allSelected = this.isAllSelected(group);
    for (const perm of group.permissions) {
      if (allSelected) {
        this.selectedIds.delete(perm.id);
      } else {
        this.selectedIds.add(perm.id);
      }
    }
  }
  permsLoading = false;
  permsError = '';

  savingProfile = false;
  savingPerms = false;
  profileError = '';

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.editStatus = this.user.status;
      this.editName = this.user.name;
      this.editRoleId = this.user.role?.id ?? '';
      this.editDepartment = this.user.department ?? '';
      this.editTitle = this.user.title ?? '';
      this.activeTab = 'profile';
      this.profileError = '';
    }
    if (changes['open'] && !this.open) {
      this.allPermissions = [];
      this.selectedIds = new Set();
      this.permsError = '';
      this.profileError = '';
    }
  }

  loadPermissionsTab(): void {
    this.activeTab = 'permissions';
    this.permsLoading = true;
    this.permissionsService.getPermissions().subscribe({
      next: perms => {
        this.allPermissions = perms;
        if (this.user) {
          this.usersService.getUserPermissions(this.user.id).subscribe({
            next: userPerms => {
              this.selectedIds = new Set(userPerms.map(p => p.id));
              this.permsLoading = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.selectedIds = new Set();
              this.permsLoading = false;
              this.toast.error('Failed to load user permissions');
              this.cdr.markForCheck();
            },
          });
        } else {
          this.selectedIds = new Set();
          this.permsLoading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.allPermissions = [];
        this.selectedIds = new Set();
        this.permsLoading = false;
        this.toast.error('Failed to load permission definitions');
        this.cdr.markForCheck();
      },
    });
  }

  togglePermission(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  saveProfile(): void {
    if (!this.user || this.savingProfile) return;
    this.savingProfile = true;
    this.profileError = '';

    const payload: UpdateUserProfilePayload = {
      status: this.editStatus !== this.user.status ? this.editStatus : undefined,
      name: this.editName !== this.user.name ? this.editName : undefined,
      department: this.editDepartment !== this.user.department ? this.editDepartment : undefined,
      title: this.editTitle !== this.user.title ? this.editTitle : undefined,
    };

    if (this.mode === 'edit') {
      // Generate initials
      let initials = '';
      const parts = this.editName.trim().split(/\s+/);
      if (parts.length > 1) {
        initials = parts
          .map(p => p[0])
          .join('')
          .slice(0, 4)
          .toUpperCase();
      } else if (parts.length === 1 && parts[0]) {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
      payload.initials = initials || null;
    }

    this.usersService.updateUser(this.user.id, payload as Partial<User>).subscribe({
      next: updated => {
        this.savingProfile = false;
        this.toast.success('User updated successfully');
        this.updated.emit(updated);
        this.closed.emit();
        this.cdr.markForCheck();
      },
      error: err => {
        this.savingProfile = false;
        this.profileError = err?.error?.message ?? 'Failed to update user.';
        this.cdr.markForCheck();
      },
    });
  }

  savePermissions(): void {
    if (!this.user || this.savingPerms) return;
    this.savingPerms = true;
    this.permsError = '';
    this.usersService.updateUserPermissions(this.user.id, Array.from(this.selectedIds)).subscribe({
      next: () => {
        this.savingPerms = false;
        this.toast.success('Permissions updated');
        this.cdr.markForCheck();
      },
      error: err => {
        this.savingPerms = false;
        this.permsError = err?.error?.message ?? 'Failed to save permissions.';
        this.cdr.markForCheck();
      },
    });
  }

  closePanel(): void {
    this.closed.emit();
  }

  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
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

  formatUserType(type: string): string {
    const map: Record<string, string> = {
      staff: 'Staff',
      mga_user: 'MGA User',
      broker_user: 'Broker User',
      customer_user: 'Customer',
    };
    return map[type] ?? type;
  }
}
