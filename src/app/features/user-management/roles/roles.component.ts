import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../models/role.model';
import { UserStatus } from '../models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { RolesApi } from '../services/roles-api';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserStatusBadgeComponent } from '../users/user-status-badge/user-status-badge.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [ConfirmDialogComponent, UserStatusBadgeComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  protected readonly UserStatus = UserStatus;

  private authService = inject(AuthService);
  private rolesService = inject(RolesApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  roles: Role[] = [];
  loading = false;

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  confirmOpen = false;
  confirmTitle = 'Delete Role';
  confirmMessage = '';
  confirmLabel = 'Delete';
  private pendingAction: (() => void) | null = null;

  currentPage = 1;
  perPage = 20;
  total = 0;
  totalPages = 1;

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.rolesService.getRoles({ page: this.currentPage, per_page: this.perPage }).subscribe({
      next: result => {
        this.roles = result.data;
        this.total = result.total;
        this.totalPages = result.total_pages;
        this.currentPage = result.page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load roles');
        this.cdr.markForCheck();
      },
    });
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadRoles();
  }

  openCreateModal(): void {
    this.router.navigate(['/user-management/roles/create']);
  }

  openEditModal(role: Role): void {
    this.router.navigate(['/user-management/roles/edit', role.id]);
  }

  onDeleteRole(role: Role): void {
    this.confirmTitle = 'Delete Role';
    this.confirmLabel = 'Delete';
    this.confirmMessage = `Delete the role "${role.label}"? Users assigned this role will need to be reassigned.`;
    this.pendingAction = () => {
      this.rolesService.deleteRole(role.id).subscribe({
        next: () => {
          this.toast.success('Role deleted');
          this.loadRoles();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Failed to delete role');
        },
      });
    };
    this.confirmOpen = true;
  }

  onToggleRoleStatus(role: Role): void {
    if (role.is_system) return;
    const nextStatus: 'active' | 'inactive' = role.is_active ? 'inactive' : 'active';
    this.confirmTitle = nextStatus === 'inactive' ? 'Deactivate Role' : 'Activate Role';
    this.confirmLabel = nextStatus === 'inactive' ? 'Deactivate' : 'Activate';
    this.confirmMessage =
      nextStatus === 'inactive'
        ? `Deactivate the role "${role.label}"? All ${role.user_count ?? 0} user(s) with this role will lose access immediately.`
        : `Activate the role "${role.label}"? Users with this role will regain access.`;
    this.pendingAction = () => {
      this.rolesService.updateRoleStatus(role.id, nextStatus).subscribe({
        next: () => {
          this.toast.success(`Role ${nextStatus === 'inactive' ? 'deactivated' : 'activated'}`);
          this.loadRoles();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Failed to update role status');
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
}
