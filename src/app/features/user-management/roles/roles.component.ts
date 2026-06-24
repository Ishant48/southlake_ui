import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Role, RoleDetail } from '../../../core/models/role.model';
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
  private rolesService = inject(RolesService);
  private toast = inject(ToastService);

  roles: Role[] = [];
  loading = false;
  modalOpen = false;
  editingRole: RoleDetail | null = null;

  confirmOpen = false;
  confirmMessage = '';
  deletingRoleId: string | null = null;

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.rolesService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load roles');
      }
    });
  }

  openCreateModal(): void {
    this.editingRole = null;
    this.modalOpen = true;
  }

  openEditModal(role: Role): void {
    this.loading = true;
    this.rolesService.getRole(role.id).subscribe({
      next: (detail) => {
        this.editingRole = detail;
        this.loading = false;
        this.modalOpen = true;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load role details');
      }
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
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Failed to delete role');
      }
    });
    this.deletingRoleId = null;
  }
}
