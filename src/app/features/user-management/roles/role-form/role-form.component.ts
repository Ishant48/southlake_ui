import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RoleDetail, CreateRolePayload } from '../../models/role.model';
import { Permission } from '../../models/permission.model';
import { RolesApi } from '../../services/roles-api';
import { PermissionsApi } from '../../services/permissions-api';
import {
  PermissionGroupingService,
  PermissionGroup,
} from '../../services/permission-grouping.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

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
  private permissionGroupingService = inject(PermissionGroupingService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  roleId: string | null = null;
  role: RoleDetail | null = null;
  isEditMode = false;
  loading = false;
  saving = false;
  errorMsg = '';

  allPermissions: Permission[] = [];
  parentModuleGroups: PermissionGroup[] = [];
  selectedIds = new Set<string>();
  expandedGroups = new Set<string>();
  expandedSubModules = new Set<string>();
  searchTerm = '';
  swatches = COLOR_SWATCHES;

  form = this.fb.group({
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
    forkJoin({
      modules: this.permissionsService.getModules(),
      permissions: this.permissionsService.getPermissions(),
    }).subscribe({
      next: ({ modules, permissions }) => {
        this.allPermissions = permissions;
        this.parentModuleGroups = this.permissionGroupingService.buildGroups(modules, permissions);

        if (this.isEditMode && this.roleId) {
          this.rolesService.getRole(this.roleId).subscribe({
            next: detail => {
              this.role = detail;
              this.form.patchValue({
                label: detail.label,
                color: detail.color,
                description: detail.description ?? '',
              });
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

  get filteredParentModuleGroups(): PermissionGroup[] {
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

  onCancel(): void {
    this.router.navigate(['/user-management/roles']);
  }

  get footerMessage(): string {
    const labelVal = this.form.get('label')?.value;
    const hasLabel = !!labelVal?.trim();
    const hasPermissions = this.selectedIds.size > 0;

    if (!hasLabel && !hasPermissions) {
      return 'Enter a display name and select at least one permission to continue.';
    } else if (!hasLabel) {
      return 'Enter a display name to continue.';
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

    const val = this.form.getRawValue();
    const payload: CreateRolePayload = {
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
