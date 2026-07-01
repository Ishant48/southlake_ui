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
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { RoleDetail, CreateRolePayload } from '../../../../core/models/role.model';
import { Permission } from '../../../../core/models/permission.model';
import { RolesService } from '../../../../core/services/roles.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

const COLOR_SWATCHES = ['#e05470', '#0d1b4b', '#2e7d32', '#1565c0', '#e65100', '#7c3aed'];

@Component({
  selector: 'app-role-permissions-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './role-permissions-modal.component.html',
  styleUrl: './role-permissions-modal.component.scss',
})
export class RolePermissionsModalComponent implements OnChanges {
  @Input() role: RoleDetail | null = null;
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

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
      journal_entry: 'Premium and claims Exhibits / Journal Entries',
      general: 'General'
    };
    return Object.entries(groups).map(([prefix, perms]) => ({
      moduleName: MODULE_NAMES[prefix] || (prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/_/g, ' ')),
      permissions: perms
    })).sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  }

  collapsedGroups = new Set<string>();

  toggleGroup(groupName: string): void {
    if (this.collapsedGroups.has(groupName)) {
      this.collapsedGroups.delete(groupName);
    } else {
      this.collapsedGroups.add(groupName);
    }
  }

  isGroupCollapsed(groupName: string): boolean {
    return this.collapsedGroups.has(groupName);
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

  swatches = COLOR_SWATCHES;
  loading = false;
  errorMsg = '';

  form = this.fb.group({
    name: ['', Validators.required],
    label: ['', Validators.required],
    color: ['#e05470'],
    description: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.errorMsg = '';
      this.loadMetaAndInit();
    }
  }

  loadMetaAndInit(): void {
    this.loading = true;
    this.permissionsService.getPermissions().subscribe({
      next: perms => {
        this.allPermissions = perms;

        if (this.role) {
          this.form.patchValue({
            name: this.role.name,
            label: this.role.label,
            color: this.role.color,
            description: this.role.description ?? '',
          });
          this.selectedIds = new Set(this.role.permissions.map(p => p.id));
        } else {
          this.form.reset({ name: '', label: '', color: '#e05470', description: '' });
          this.selectedIds = new Set();
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load permissions');
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

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  closeModal(): void {
    this.closed.emit();
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMsg = '';

    const val = this.form.value;
    const payload: CreateRolePayload = {
      name: val.name as string,
      label: val.label as string,
      color: val.color as string,
      description: val.description ?? undefined,
      permissions: Array.from(this.selectedIds),
    };

    const obs = this.role
      ? this.rolesService.updateRole(this.role.id, payload)
      : this.rolesService.createRole(payload);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.toast.success(this.role ? 'Role updated' : 'Role created');
        this.saved.emit();
        this.closed.emit();
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? 'Failed to save role.';
      },
    });
  }
}
