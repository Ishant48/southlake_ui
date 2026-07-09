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
import { forkJoin } from 'rxjs';
import { User, UserStatus, PanelMode, UserDetailTab } from '../../models/user.model';
import { Permission } from '../../models/permission.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersApi } from '../../services/users-api';
import { PermissionsApi } from '../../services/permissions-api';
import {
  PermissionGroupingService,
  PermissionGroup,
} from '../../services/permission-grouping.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UserStatusBadgeComponent } from '../user-status-badge/user-status-badge.component';

import { Role } from '../../models/role.model';

interface UpdateUserProfilePayload {
  status?: UserStatus;
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
  protected readonly UserStatus = UserStatus;
  protected readonly UserDetailTab = UserDetailTab;
  protected readonly PanelMode = PanelMode;

  @Input() user: User | null = null;
  @Input() open = false;
  @Input() roles: Role[] = [];
  @Input() mode: PanelMode = PanelMode.View;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  private authService = inject(AuthService);
  private usersService = inject(UsersApi);
  private permissionsService = inject(PermissionsApi);
  private permissionGroupingService = inject(PermissionGroupingService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: UserDetailTab = UserDetailTab.Profile;
  editStatus: UserStatus = UserStatus.Active;
  editName = '';
  editRoleId = '';
  editDepartment = '';
  editTitle = '';

  allPermissions: Permission[] = [];
  parentModuleGroups: PermissionGroup[] = [];
  searchTerm = '';
  selectedIds = new Set<string>();

  expandedGroups = new Set<string>();
  expandedSubModules = new Set<string>();

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

  toggleSubModule(subName: string): void {
    if (this.expandedSubModules.has(subName)) {
      this.expandedSubModules.delete(subName);
    } else {
      this.expandedSubModules.add(subName);
    }
  }

  isSubModuleExpanded(subName: string): boolean {
    return this.expandedSubModules.has(subName);
  }

  isSubModuleAllSelected(sub: { name: string; permissions: Permission[] }): boolean {
    if (!sub.permissions.length) return false;
    return sub.permissions.every(perm => this.selectedIds.has(perm.id));
  }

  toggleSelectAllSubModule(sub: { name: string; permissions: Permission[] }): void {
    const allSelected = this.isSubModuleAllSelected(sub);
    for (const perm of sub.permissions) {
      if (allSelected) {
        this.selectedIds.delete(perm.id);
      } else {
        this.selectedIds.add(perm.id);
      }
    }
  }

  isAllSelected(group: { name: string; permissions: Permission[] }): boolean {
    if (!group.permissions.length) return false;
    return group.permissions.every(perm => this.selectedIds.has(perm.id));
  }

  get filteredModuleGroups(): PermissionGroup[] {
    const search = this.searchTerm.trim().toLowerCase();
    const groups = this.parentModuleGroups;
    if (!search) return groups;

    return groups
      .map(group => {
        const filteredSubs = group.subModules
          .map(sub => {
            const matchesSub = sub.name.toLowerCase().includes(search);
            const filteredPerms = sub.permissions.filter(
              p =>
                matchesSub ||
                p.label.toLowerCase().includes(search) ||
                p.action.toLowerCase().includes(search),
            );
            return { ...sub, permissions: filteredPerms };
          })
          .filter(sub => sub.permissions.length > 0);

        const allFilteredPerms = filteredSubs.reduce<Permission[]>(
          (acc, sub) => [...acc, ...sub.permissions],
          [],
        );

        return {
          ...group,
          permissions: allFilteredPerms,
          subModules: filteredSubs,
        };
      })
      .filter(group => group.permissions.length > 0);
  }

  toggleSelectAllGroup(group: { name: string; permissions: Permission[] }): void {
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

  isSuperAdmin(): boolean {
    if (!this.user) return false;
    return !!this.user.is_super_admin;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.editStatus = this.user.status;
      this.editName = this.user.name;
      this.editRoleId = this.user.role?.id ?? '';
      this.editDepartment = this.user.department ?? '';
      this.editTitle = this.user.title ?? '';
      this.activeTab = UserDetailTab.Profile;
      this.profileError = '';
    }
    if (changes['open'] && !this.open) {
      this.allPermissions = [];
      this.parentModuleGroups = [];
      this.searchTerm = '';
      this.selectedIds = new Set();
      this.permsError = '';
      this.profileError = '';
    }
  }

  loadPermissionsTab(): void {
    this.activeTab = UserDetailTab.Permissions;
    this.permsLoading = true;
    forkJoin({
      modules: this.permissionsService.getModules(),
      permissions: this.permissionsService.getPermissions(),
    }).subscribe({
      next: ({ modules, permissions }) => {
        this.allPermissions = permissions;
        this.parentModuleGroups = this.permissionGroupingService.buildGroups(modules, permissions);
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
        this.parentModuleGroups = [];
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
    this.profileError = '';

    if (this.mode === PanelMode.Edit && this.editName.trim().length === 0) {
      this.profileError = 'Display name is required';
      return;
    }

    this.savingProfile = true;

    const payload: UpdateUserProfilePayload = {
      status: this.editStatus !== this.user.status ? this.editStatus : undefined,
      name: this.editName !== this.user.name ? this.editName : undefined,
      department: this.editDepartment !== this.user.department ? this.editDepartment : undefined,
      title: this.editTitle !== this.user.title ? this.editTitle : undefined,
    };

    if (this.mode === PanelMode.Edit) {
      payload.name = this.editName;
      payload.role_id = this.editRoleId;
      payload.department = this.editDepartment || null;
      payload.title = this.editTitle || null;
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
