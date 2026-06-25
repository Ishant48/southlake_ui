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
import { forkJoin } from 'rxjs';
import { RoleDetail, RolePermission, CreateRolePayload } from '../../../../core/models/role.model';
import { PermissionActionKey, Module } from '../../../../core/models/permission.model';
import { RolesService } from '../../../../core/services/roles.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

const COLOR_SWATCHES = ['#e05470', '#0d1b4b', '#2e7d32', '#1565c0', '#e65100', '#7c3aed'];

@Component({
  selector: 'app-role-permissions-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  modules: Module[] = [];
  allActions: { key: string; label: string }[] = [];
  swatches = COLOR_SWATCHES;
  permissions: RolePermission[] = [];
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
    forkJoin({
      modules: this.permissionsService.getModules(),
      actions: this.permissionsService.getPermissions(),
    }).subscribe({
      next: res => {
        this.modules = res.modules;
        
        // Define standard ordering array in frontend to ensure correct layout
        const ACTION_ORDER = ['view', 'create', 'edit', 'approve', 'export', 'post', 'file', 'lock', 'override', 'reconcile', 'void', 'reverse'];
        const sortedActions = [...res.actions].sort((a, b) => ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action));
        this.allActions = sortedActions.map(a => ({ key: a.action, label: a.label }));

        if (this.role) {
          this.form.patchValue({
            name: this.role.name,
            label: this.role.label,
            color: this.role.color,
            description: this.role.description ?? '',
          });
          this.permissions = this.role.permissions
            ? [...this.role.permissions]
            : this.modules.map(m => this.defaultPerm(m.id));
        } else {
          this.form.reset({ name: '', label: '', color: '#e05470', description: '' });
          this.permissions = this.modules.map(m => this.defaultPerm(m.id));
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load permission definitions');
        this.cdr.markForCheck();
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  defaultPerm(module_id: string): RolePermission {
    return {
      module_id,
      view: false,
      create: false,
      edit: false,
      approve: false,
      export: false,
      post: false,
      file: false,
      lock: false,
      override: false,
      reconcile: false,
      void: false,
      reverse: false,
    };
  }

  getPermRow(moduleId: string): RolePermission {
    let row = this.permissions.find(p => p.module_id === moduleId);
    if (!row) {
      row = this.defaultPerm(moduleId);
      this.permissions.push(row);
    }
    return row;
  }

  getPermValue(moduleId: string, action: string): boolean {
    return (this.getPermRow(moduleId) as unknown as Record<string, unknown>)[action] as boolean;
  }

  setPermValue(moduleId: string, action: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const row = this.getPermRow(moduleId);
    (row as unknown as Record<string, boolean>)[action] = checked;
    this.permissions = [...this.permissions];
  }

  setPreset(moduleId: string, preset: 'full' | 'read' | 'none'): void {
    const row = this.getPermRow(moduleId);
    const allKeys: PermissionActionKey[] = [
      'view',
      'create',
      'edit',
      'approve',
      'export',
      'post',
      'file',
      'lock',
      'override',
      'reconcile',
      'void',
      'reverse',
    ];
    if (preset === 'full') {
      allKeys.forEach(k => ((row as unknown as Record<string, unknown>)[k] = true));
    } else if (preset === 'read') {
      allKeys.forEach(k => ((row as unknown as Record<string, unknown>)[k] = k === 'view'));
    } else {
      allKeys.forEach(k => ((row as unknown as Record<string, unknown>)[k] = false));
    }
    this.permissions = [...this.permissions];
  }

  get permSummary(): { label: string; count: number; color: string }[] {
    const allKeys: PermissionActionKey[] = [
      'view',
      'create',
      'edit',
      'approve',
      'export',
      'post',
      'file',
      'lock',
      'override',
      'reconcile',
      'void',
      'reverse',
    ];
    let full = 0,
      readOnly = 0,
      noAccess = 0,
      custom = 0;
    for (const mod of this.modules) {
      const row = this.permissions.find(p => p.module_id === mod.id);
      if (!row) {
        noAccess++;
        continue;
      }
      const allTrue = allKeys.every(k => row[k]);
      const allFalse = allKeys.every(k => !row[k]);
      const onlyView = row.view && allKeys.filter(k => k !== 'view').every(k => !row[k]);
      if (allTrue) full++;
      else if (allFalse) noAccess++;
      else if (onlyView) readOnly++;
      else custom++;
    }
    return [
      { label: 'Full Access', count: full, color: 'var(--navy)' },
      { label: 'Custom', count: custom, color: 'var(--blue)' },
      { label: 'Read Only', count: readOnly, color: 'var(--orange)' },
      { label: 'No Access', count: noAccess, color: 'var(--gray-500)' },
    ];
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
      permissions: this.permissions,
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
