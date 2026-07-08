import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Role } from '../models/role.model';
import { AuthService } from '../../../core/services/auth.service';
import { RolesApi } from '../services/roles-api';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [ConfirmDialogComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
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
  confirmMessage = '';
  deletingRoleId: string | null = null;

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
