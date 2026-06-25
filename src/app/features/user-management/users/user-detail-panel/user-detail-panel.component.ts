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
import { User } from '../../../../core/models/user.model';
import { RolePermission } from '../../../../core/models/role.model';
import { PermissionActionKey, Module } from '../../../../core/models/permission.model';
import { UsersService } from '../../../../core/services/users.service';
import { PermissionsService } from '../../../../core/services/permissions.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UserStatusBadgeComponent } from '../user-status-badge/user-status-badge.component';

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
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  private usersService = inject(UsersService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'profile' | 'permissions' = 'profile';
  editStatus: 'active' | 'inactive' | 'pending' = 'active';

  permissions: RolePermission[] = [];
  permsLoading = false;
  permsError = '';

  savingProfile = false;
  savingPerms = false;
  profileError = '';

  modules: Module[] = [];
  visibleActions: { key: string; label: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.editStatus = this.user.status;
      this.activeTab = 'profile';
      this.profileError = '';
    }
    if (changes['open'] && !this.open) {
      this.permissions = [];
      this.permsError = '';
      this.profileError = '';
    }
  }

  loadPermissionsTab(): void {
    this.activeTab = 'permissions';
    this.permsLoading = true;
    forkJoin({
      modules: this.permissionsService.getModules(),
      actions: this.permissionsService.getPermissions(),
      userPerms: this.user ? this.usersService.getUserPermissions(this.user.id) : of([]),
    }).subscribe({
      next: res => {
        this.modules = res.modules;

        // Define standard ordering array in frontend to ensure correct layout
        const ACTION_ORDER = ['view', 'create', 'edit', 'approve', 'export', 'post', 'file', 'lock', 'override', 'reconcile', 'void', 'reverse'];
        const sortedActions = [...res.actions].sort((a, b) => ACTION_ORDER.indexOf(a.action) - ACTION_ORDER.indexOf(b.action));
        this.visibleActions = sortedActions.slice(0, 5).map(a => ({ key: a.action, label: a.label }));

        this.permissions = res.userPerms;
        
        // Ensure default permissions exist for any new modules that are not configured yet
        for (const mod of this.modules) {
          if (!this.permissions.find(p => p.module_id === mod.id)) {
            this.permissions.push(this.defaultPerm(mod.id));
          }
        }

        this.permsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.modules = [];
        this.visibleActions = [];
        this.permissions = [];
        this.permsLoading = false;
        this.toast.error('Failed to load permission definitions');
        this.cdr.markForCheck();
      },
    });
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
    const row = this.getPermRow(moduleId);
    return row[action as PermissionActionKey] as boolean;
  }

  setPermValue(moduleId: string, action: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const row = this.getPermRow(moduleId);
    (row as unknown as Record<string, boolean>)[action] = checked;
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

  saveProfile(): void {
    if (!this.user || this.savingProfile) return;
    this.savingProfile = true;
    this.profileError = '';
    this.usersService.updateUser(this.user.id, { status: this.editStatus }).subscribe({
      next: updated => {
        this.savingProfile = false;
        this.toast.success('User updated successfully');
        this.updated.emit(updated);
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
    this.usersService.updateUserPermissions(this.user.id, this.permissions).subscribe({
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
