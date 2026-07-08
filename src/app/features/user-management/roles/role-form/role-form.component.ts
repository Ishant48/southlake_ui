import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { RoleDetail, CreateRolePayload } from '../../models/role.model';
import { Permission } from '../../models/permission.model';
import { RolesApi } from '../../services/roles-api';
import { PermissionsApi } from '../../services/permissions-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

const COLOR_SWATCHES = ['#e05470', '#0d1b4b', '#2e7d32', '#1565c0', '#e65100', '#7c3aed'];

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './role-form.component.html',
  styleUrl: './role-form.component.scss',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private rolesService = inject(RolesApi);
  private permissionsService = inject(PermissionsApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  roleId: string | null = null;
  role: RoleDetail | null = null;
  isEditMode = false;
  loading = false;
  saving = false;
  errorMsg = '';

  allPermissions: Permission[] = [];
  selectedIds = new Set<string>();
  expandedGroups = new Set<string>();
  expandedSubModules = new Set<string>();
  searchTerm = '';
  swatches = COLOR_SWATCHES;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
    label: ['', Validators.required],
    color: ['#e05470'],
    description: [''],
  });

  ngOnInit(): void {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.roleId;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.permissionsService.getPermissions().subscribe({
      next: perms => {
        this.allPermissions = perms;
        if (this.isEditMode && this.roleId) {
          this.rolesService.getRole(this.roleId).subscribe({
            next: detail => {
              this.role = detail;
              this.form.patchValue({
                name: detail.name,
                label: detail.label,
                color: detail.color,
                description: detail.description ?? '',
              });
              // System roles cannot change their system name
              if (detail.is_system) {
                this.form.get('name')?.disable();
              }
              this.selectedIds = new Set(detail.permissions.map(p => p.id));
              this.loading = false;
              // Expand all groups by default in edit mode to review configured permissions
              this.expandAll();
              this.cdr.markForCheck();
            },
            error: () => {
              this.loading = false;
              this.toast.error('Failed to load role details');
              this.router.navigate(['/user-management/roles']);
              this.cdr.markForCheck();
            },
          });
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load permissions');
        this.cdr.markForCheck();
      },
    });
  }

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

  get filteredParentModuleGroups() {
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

  toggleGroup(groupName: string): void {
    if (this.expandedGroups.has(groupName)) {
      this.expandedGroups.delete(groupName);
    } else {
      this.expandedGroups.add(groupName);
    }
  }

  isGroupExpanded(groupName: string): boolean {
    if (this.searchTerm.trim()) {
      return true; // Auto-expand when searching
    }
    return this.expandedGroups.has(groupName);
  }

  isGroupAllSelected(group: { name: string; permissions: Permission[] }): boolean {
    if (!group.permissions.length) return false;
    return group.permissions.every(perm => this.selectedIds.has(perm.id));
  }

  toggleSelectAllGroup(group: { name: string; permissions: Permission[] }): void {
    const allSelected = this.isGroupAllSelected(group);
    for (const perm of group.permissions) {
      if (allSelected) {
        this.selectedIds.delete(perm.id);
      } else {
        this.selectedIds.add(perm.id);
      }
    }
  }

  getGroupSelectedCount(group: { name: string; permissions: Permission[] }): number {
    return group.permissions.filter(p => this.selectedIds.has(p.id)).length;
  }

  isAllGlobalSelected(): boolean {
    if (!this.allPermissions.length) return false;
    return this.allPermissions.every(p => this.selectedIds.has(p.id));
  }

  toggleSelectAllGlobal(): void {
    const allSelected = this.isAllGlobalSelected();
    if (allSelected) {
      this.selectedIds.clear();
    } else {
      for (const p of this.allPermissions) {
        this.selectedIds.add(p.id);
      }
    }
  }

  toggleSubModule(subName: string): void {
    if (this.expandedSubModules.has(subName)) {
      this.expandedSubModules.delete(subName);
    } else {
      this.expandedSubModules.add(subName);
    }
  }

  isSubModuleExpanded(subName: string): boolean {
    if (this.searchTerm.trim()) {
      return true; // Auto-expand when searching
    }
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

  getSubModuleSelectedCount(sub: { name: string; permissions: Permission[] }): number {
    return sub.permissions.filter(p => this.selectedIds.has(p.id)).length;
  }

  expandAll(): void {
    this.expandedGroups = new Set(this.parentModuleGroups.map(g => g.name));
    const subs = [];
    for (const g of this.parentModuleGroups) {
      for (const s of g.subModules) {
        subs.push(s.name);
      }
    }
    this.expandedSubModules = new Set(subs);
  }

  collapseAll(): void {
    this.expandedGroups.clear();
    this.expandedSubModules.clear();
  }

  togglePermission(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get footerMessage(): string {
    const nameVal = this.form.get('name')?.value;
    const labelVal = this.form.get('label')?.value;
    const hasName = !!nameVal?.trim();
    const hasLabel = !!labelVal?.trim();
    const hasPermissions = this.selectedIds.size > 0;

    if ((!hasName || !hasLabel) && !hasPermissions) {
      return 'Enter a role name and select at least one permission to continue.';
    } else if (!hasName || !hasLabel) {
      return 'Enter a role name and display label to continue.';
    } else if (!hasPermissions) {
      return 'Select at least one permission to continue.';
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.form.valid && this.selectedIds.size > 0;
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (!this.isFormValid || this.saving) return;
    this.saving = true;
    this.errorMsg = '';

    const val = this.form.getRawValue(); // use getRawValue in case name is disabled
    const payload: CreateRolePayload = {
      name: val.name as string,
      label: val.label as string,
      color: val.color as string,
      description: val.description ?? undefined,
      permissions: Array.from(this.selectedIds),
    };

    const obs =
      this.isEditMode && this.roleId
        ? this.rolesService.updateRole(this.roleId, payload)
        : this.rolesService.createRole(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.toast.success(this.isEditMode ? 'Role updated' : 'Role created');
        this.router.navigate(['/user-management/roles']);
      },
      error: err => {
        this.saving = false;
        this.errorMsg = err?.error?.message ?? 'Failed to save role.';
        this.cdr.markForCheck();
      },
    });
  }
}
