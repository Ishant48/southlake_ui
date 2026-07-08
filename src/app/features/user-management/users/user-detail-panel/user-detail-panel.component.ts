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
import { forkJoin, of } from 'rxjs';
import { User, UserStatus, PanelMode, UserDetailTab } from '../../models/user.model';
import { Permission } from '../../models/permission.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersApi } from '../../services/users-api';
import { PermissionsApi } from '../../services/permissions-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UserStatusBadgeComponent } from '../user-status-badge/user-status-badge.component';

import { Role } from '../../models/role.model';

interface UpdateUserProfilePayload {
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
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: UserDetailTab = UserDetailTab.Profile;
  editStatus: UserStatus = UserStatus.Active;
  editName = '';
  editRoleId = '';
  editDepartment = '';
  editTitle = '';

  allPermissions: Permission[] = [];
  selectedIds = new Set<string>();

  get parentModuleGroups(): {
    name: string;
    icon: string;
    permissions: Permission[];
    subModules: { name: string; permissions: Permission[] }[];
  }[] {
    const subGroups: Record<string, Permission[]> = {};
    for (const perm of this.allPermissions) {
      const parts = perm.action.split('.');
      const prefix = parts.length > 1 ? parts[0] : 'general';
      if (!subGroups[prefix]) {
        subGroups[prefix] = [];
      }
      subGroups[prefix].push(perm);
    }

    const SUB_NAMES: Record<string, string> = {
      activity_log: 'Activity Logs',
      permission: 'Permissions',
      role: 'Roles',
      user: 'Users',
      chart_of_accounts: 'Chart of Accounts',
      gl_mapping: 'GL Mappings',
      journal_entry: 'Journal Entries',
      broker: 'Brokers',
      cob: 'Classes of Business',
      lob: 'Lines of Business',
      masters_config: 'Masters Configuration',
      mga: 'MGAs',
      product: 'Products',
      reinsurer: 'Reinsurers',
      risk_company: 'Risk Companies',
      state: 'States',
      treaty: 'Treaties',
      reports: 'Reports',
      test_balance: 'Test Balance',
      workbook: 'Workbooks',
      financial_reports: 'Financial Reports',
      database_seeder: 'Database Seeder',
      general: 'General',
    };

    const dashboardPerms: Permission[] = [];
    const accountingPerms: Permission[] = [];
    const adminPerms: Permission[] = [];
    const mgaPerms: Permission[] = [];

    const dashboardSubs: Record<string, Permission[]> = {};
    const accountingSubs: Record<string, Permission[]> = {};
    const adminSubs: Record<string, Permission[]> = {};
    const mgaSubs: Record<string, Permission[]> = {};

    for (const [prefix, perms] of Object.entries(subGroups)) {
      for (const p of perms) {
        const pClone = { ...p };
        let subName =
          SUB_NAMES[prefix] ?? prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/_/g, ' ');

        if (pClone.action === 'reports.view' || pClone.action === 'reports.post') {
          subName = 'Overview & KPIs';
          if (pClone.action === 'reports.view') {
            pClone.label = 'View Overview & KPIs';
          } else if (pClone.action === 'reports.post') {
            pClone.label = 'Export Overview & KPIs';
          }
          dashboardPerms.push(pClone);
          if (!dashboardSubs[subName]) dashboardSubs[subName] = [];
          dashboardSubs[subName].push(pClone);
        } else if (
          prefix === 'chart_of_accounts' ||
          pClone.action === 'gl_mapping.view' ||
          prefix === 'journal_entry' ||
          pClone.action === 'workbook.view' ||
          pClone.action === 'workbook.create' ||
          pClone.action === 'test_balance.view' ||
          pClone.action === 'test_balance.create'
        ) {
          if (prefix === 'chart_of_accounts') {
            subName = 'Chart of Accounts';
          } else if (pClone.action === 'gl_mapping.view') {
            subName = 'Chart of Accounts';
            pClone.label = 'Export Chart of Accounts';
          } else if (prefix === 'journal_entry') {
            subName = 'Journal Entries';
            if (pClone.action === 'journal_entry.post') {
              pClone.label = 'Export Journal Entries';
            }
          } else if (pClone.action === 'workbook.view' || pClone.action === 'workbook.create') {
            subName = 'Premium & Claims Exhibits';
            if (pClone.action === 'workbook.view') {
              pClone.label = 'View Premium & Claims Exhibits';
            } else if (pClone.action === 'workbook.create') {
              pClone.label = 'Export Premium & Claims Exhibits';
            }
          } else if (
            pClone.action === 'test_balance.view' ||
            pClone.action === 'test_balance.create'
          ) {
            subName = 'Test Balance';
            if (pClone.action === 'test_balance.view') {
              pClone.label = 'View Test Balance';
            } else if (pClone.action === 'test_balance.create') {
              pClone.label = 'Export Test Balance';
            }
          }

          accountingPerms.push(pClone);
          if (!accountingSubs[subName]) accountingSubs[subName] = [];
          accountingSubs[subName].push(pClone);
        } else if (
          prefix === 'user' ||
          prefix === 'role' ||
          prefix === 'permission' ||
          pClone.action === 'activity_log.view' ||
          pClone.action === 'activity_log.export'
        ) {
          if (prefix === 'user') {
            subName = 'Users';
          } else if (pClone.action === 'permission.view') {
            subName = 'Users';
            pClone.label = 'Export Users';
          } else if (prefix === 'role') {
            subName = 'Roles & Permissions';
            if (pClone.action === 'role.view') pClone.label = 'View Roles & Permissions';
            if (pClone.action === 'role.create') pClone.label = 'Create Roles & Permissions';
            if (pClone.action === 'role.edit') pClone.label = 'Edit Roles & Permissions';
            if (pClone.action === 'role.delete') pClone.label = 'Delete Roles & Permissions';
          } else if (prefix === 'permission' && pClone.action !== 'permission.view') {
            subName = 'Activity Logs';
            if (pClone.action === 'permission.create') pClone.label = 'Create Activity Logs';
            if (pClone.action === 'permission.edit') pClone.label = 'Edit Activity Logs';
            if (pClone.action === 'permission.delete') pClone.label = 'Delete Activity Logs';
          } else if (
            pClone.action === 'activity_log.view' ||
            pClone.action === 'activity_log.export'
          ) {
            subName = 'Activity Logs';
            if (pClone.action === 'activity_log.view') pClone.label = 'View Activity Logs';
            if (pClone.action === 'activity_log.export') pClone.label = 'Export Activity Logs';
          }

          adminPerms.push(pClone);
          if (!adminSubs[subName]) adminSubs[subName] = [];
          adminSubs[subName].push(pClone);
        } else {
          const MGA_MAP: Record<string, { sub: string; label: string }> = {
            // Treaties: 5
            'treaty.view': { sub: 'Treaties', label: 'View Treaties' },
            'treaty.create': { sub: 'Treaties', label: 'Create Treaties' },
            'treaty.edit': { sub: 'Treaties', label: 'Edit Treaties' },
            'treaty.delete': { sub: 'Treaties', label: 'Delete Treaties' },
            'database_seeder.edit': { sub: 'Treaties', label: 'Export Treaties' },

            // MGAs: 5
            'mga.view': { sub: 'MGAs', label: 'View MGAs' },
            'mga.create': { sub: 'MGAs', label: 'Create MGAs' },
            'mga.edit': { sub: 'MGAs', label: 'Edit MGAs' },
            'mga.delete': { sub: 'MGAs', label: 'Delete MGAs' },
            'database_seeder.delete': { sub: 'MGAs', label: 'Export MGAs' },

            // LOBs: 5
            'lob.view': { sub: 'LOBs', label: 'View LOBs' },
            'lob.create': { sub: 'LOBs', label: 'Create LOBs' },
            'lob.edit': { sub: 'LOBs', label: 'Edit LOBs' },
            'lob.delete': { sub: 'LOBs', label: 'Delete LOBs' },
            'financial_reports.view': { sub: 'LOBs', label: 'Export LOBs' },

            // COBs: 5
            'cob.view': { sub: 'COBs', label: 'View COBs' },
            'cob.create': { sub: 'COBs', label: 'Create COBs' },
            'cob.edit': { sub: 'COBs', label: 'Edit COBs' },
            'cob.delete': { sub: 'COBs', label: 'Delete COBs' },
            'financial_reports.create': { sub: 'COBs', label: 'Export COBs' },

            // States: 5
            'state.view': { sub: 'States', label: 'View States' },
            'state.create': { sub: 'States', label: 'Create States' },
            'state.edit': { sub: 'States', label: 'Edit States' },
            'state.delete': { sub: 'States', label: 'Delete States' },
            'financial_reports.edit': { sub: 'States', label: 'Export States' },

            // Reinsurers: 5
            'reinsurer.view': { sub: 'Reinsurers', label: 'View Reinsurers' },
            'reinsurer.create': { sub: 'Reinsurers', label: 'Create Reinsurers' },
            'reinsurer.edit': { sub: 'Reinsurers', label: 'Edit Reinsurers' },
            'reinsurer.delete': { sub: 'Reinsurers', label: 'Delete Reinsurers' },
            'financial_reports.delete': { sub: 'Reinsurers', label: 'Export Reinsurers' },

            // Risk Companies: 5
            'risk_company.view': { sub: 'Risk Companies', label: 'View Risk Companies' },
            'risk_company.create': { sub: 'Risk Companies', label: 'Create Risk Companies' },
            'risk_company.edit': { sub: 'Risk Companies', label: 'Edit Risk Companies' },
            'risk_company.delete': { sub: 'Risk Companies', label: 'Delete Risk Companies' },
            'activity_log.create': { sub: 'Risk Companies', label: 'Export Risk Companies' },

            // Brokers: 5
            'broker.view': { sub: 'Brokers', label: 'View Brokers' },
            'broker.create': { sub: 'Brokers', label: 'Create Brokers' },
            'broker.edit': { sub: 'Brokers', label: 'Edit Brokers' },
            'broker.delete': { sub: 'Brokers', label: 'Delete Brokers' },
            'activity_log.edit': { sub: 'Brokers', label: 'Export Brokers' },

            // Products: 5
            'product.view': { sub: 'Products', label: 'View Products' },
            'product.create': { sub: 'Products', label: 'Create Products' },
            'product.edit': { sub: 'Products', label: 'Edit Products' },
            'product.delete': { sub: 'Products', label: 'Delete Products' },
            'activity_log.delete': { sub: 'Products', label: 'Export Products' },

            // Document Types: 5
            'reports.edit': { sub: 'Document Types', label: 'View Document Types' },
            'reports.delete': { sub: 'Document Types', label: 'Create Document Types' },
            'workbook.edit': { sub: 'Document Types', label: 'Edit Document Types' },
            'workbook.delete': { sub: 'Document Types', label: 'Delete Document Types' },
            'database_seeder.create': { sub: 'Document Types', label: 'Export Document Types' },

            // Sequence Counters: 3
            'test_balance.edit': { sub: 'Sequence Counters', label: 'View Sequence Counters' },
            'test_balance.delete': { sub: 'Sequence Counters', label: 'Edit Sequence Counters' },
            'reports.create': { sub: 'Sequence Counters', label: 'Export Sequence Counters' },

            // Month-End Closing: 4
            'masters_config.view': { sub: 'Month-End Closing', label: 'View Month-End Closing' },
            'masters_config.create': { sub: 'Month-End Closing', label: 'Close Month-End Closing' },
            'masters_config.edit': { sub: 'Month-End Closing', label: 'Reopen Month-End Closing' },
            'masters_config.delete': {
              sub: 'Month-End Closing',
              label: 'Export Month-End Closing',
            },

            // GL Map: 5
            'gl_mapping.create': { sub: 'GL Map', label: 'Create GL Map' },
            'gl_mapping.edit': { sub: 'GL Map', label: 'Edit GL Map' },
            'gl_mapping.delete': { sub: 'GL Map', label: 'Delete GL Map' },
            'database_seeder.view': { sub: 'GL Map', label: 'View GL Map' },
            'database_seeder.manage': { sub: 'GL Map', label: 'Export GL Map' },
          };

          const mapped = MGA_MAP[pClone.action];
          if (mapped) {
            subName = mapped.sub;
            pClone.label = mapped.label;
          }

          mgaPerms.push(pClone);
          if (!mgaSubs[subName]) mgaSubs[subName] = [];
          mgaSubs[subName].push(pClone);
        }
      }
    }

    const formatSubs = (subsRecord: Record<string, Permission[]>) => {
      return Object.entries(subsRecord)
        .map(([name, perms]) => ({
          name,
          permissions: perms.sort((a, b) => a.label.localeCompare(b.label)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    return [
      {
        name: 'Dashboard',
        icon: 'grid',
        permissions: dashboardPerms,
        subModules: formatSubs(dashboardSubs),
      },
      {
        name: 'Advanced Accounting',
        icon: 'file',
        permissions: accountingPerms,
        subModules: formatSubs(accountingSubs),
      },
      {
        name: 'MGA Operations',
        icon: 'home',
        permissions: mgaPerms,
        subModules: formatSubs(mgaSubs),
      },
      {
        name: 'System Admin',
        icon: 'admin',
        permissions: adminPerms,
        subModules: formatSubs(adminSubs),
      },
    ];
  }

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
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR: false is a meaningful value here, not a fallback case
    return !!(this.user.is_super_admin || this.user.email === 'admin@southlake.com');
  }

  isSelf(): boolean {
    if (!this.user) return false;
    return this.authService.getCurrentUser()?.id === this.user.id;
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
      this.selectedIds = new Set();
      this.permsError = '';
      this.profileError = '';
    }
  }

  loadPermissionsTab(): void {
    this.activeTab = UserDetailTab.Permissions;
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

    const statusChanged = this.editStatus !== this.user.status;

    const payload: UpdateUserProfilePayload = {
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

    const hasProfileChanges = Object.values(payload).some(v => v !== undefined);

    const profile$ = hasProfileChanges
      ? this.usersService.updateUser(this.user.id, payload as Partial<User>)
      : of(this.user);
    const status$ = statusChanged
      ? this.usersService.updateUserStatus(this.user.id, this.editStatus)
      : of(this.user);

    forkJoin([profile$, status$]).subscribe({
      next: ([profileResult, statusResult]) => {
        this.savingProfile = false;
        this.toast.success('User updated successfully');
        this.updated.emit(statusChanged ? statusResult : profileResult);
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
