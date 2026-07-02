import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role, RoleDetail } from '../../../core/models/role.model';
import { AuthService } from '../../../core/services/auth.service';
import { RolesService } from '../../../core/services/roles.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { RolePermissionsModalComponent } from './role-permissions-modal/role-permissions-modal.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RolePermissionsModalComponent, ConfirmDialogComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private authService = inject(AuthService);
  private rolesService = inject(RolesService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  roles: Role[] = [];
  loading = false;

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }
  modalOpen = false;
  editingRole: RoleDetail | null = null;

  confirmOpen = false;
  confirmMessage = '';
  deletingRoleId: string | null = null;

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

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadRoles();
  }

  openCreateModal(): void {
    this.editingRole = null;
    this.modalOpen = true;
  }

  openEditModal(role: Role): void {
    this.loading = true;
    this.rolesService.getRole(role.id).subscribe({
      next: detail => {
        this.editingRole = detail;
        this.loading = false;
        this.modalOpen = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load role details');
        this.cdr.markForCheck();
      },
    });
  }

  onRoleSaved(): void {
    this.loadRoles();
  }

  onDeleteRole(role: Role): void {
    this.confirmMessage = `Delete the role "${role.label}"? Users assigned this role will need to be reassigned.`;
    this.deletingRoleId = role.id;
    this.confirmOpen = true;
  }

  onDeleteConfirmed(): void {
    this.confirmOpen = false;
    if (!this.deletingRoleId) return;
    this.rolesService.deleteRole(this.deletingRoleId).subscribe({
      next: () => {
        this.toast.success('Role deleted');
        this.loadRoles();
      },
      error: err => {
        this.toast.error(err?.error?.message ?? 'Failed to delete role');
      },
    });
    this.deletingRoleId = null;
  }
}
