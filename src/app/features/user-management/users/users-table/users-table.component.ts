import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { Role } from '../../../../core/models/role.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, ColDef, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { AgGridConfigService } from '../../../../core/services/ag-grid-config.service';
import { AvatarCell } from '../../../../shared/components/grid-renderers/avatar-cell/avatar-cell';
import { StatusBadgeCell } from '../../../../shared/components/grid-renderers/status-badge-cell/status-badge-cell';
import {
  ActionButtonsCell,
  ActionButtonConfig,
} from '../../../../shared/components/grid-renderers/action-buttons-cell/action-buttons-cell';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent implements OnInit {
  private authService = inject(AuthService);
  private agGridConfig = inject(AgGridConfigService);

  @Input() users: User[] = [];
  @Input() loading = false;
  @Input() showCheckboxes = true;

  @Output() viewUser = new EventEmitter<User>();
  @Output() editUser = new EventEmitter<User>();
  @Output() deactivateUser = new EventEmitter<User>();
  @Output() selectionChanged = new EventEmitter<string[]>();

  gridOptions!: GridOptions;
  columnDefs: ColDef<User>[] = [];
  skeletonRows = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.gridOptions = this.agGridConfig.getDefaultGridOptions();
    this.setupColumns();
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  setupColumns(): void {
    this.columnDefs = [];

    if (this.showCheckboxes) {
      this.columnDefs.push({
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        resizable: false,
        sortable: false,
        pinned: 'left',
      });
    }

    this.columnDefs.push(
      {
        headerName: 'USER',
        field: 'name',
        cellRenderer: AvatarCell,
        minWidth: 250,
        flex: 2,
        valueGetter: params => params.data,
      },
      {
        headerName: 'ROLE',
        field: 'role',
        cellRenderer: (params: ICellRendererParams<User, Role>) => {
          const role = params.value;
          if (role) {
            const hex = role.color;
            let rgba = 'rgba(13,27,75,0.1)';
            if (hex && hex.length >= 7) {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              rgba = `rgba(${r},${g},${b},0.1)`;
            }
            return `<span class="role-badge" style="background: ${rgba}; color: ${role.color}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${role.label}</span>`;
          }
          return `<span class="text-muted">-</span>`;
        },
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'DEPARTMENT',
        field: 'department',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' is a valid falsy value that should also render as '-'
        valueFormatter: params => params.value || '-',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'TITLE',
        field: 'title',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' is a valid falsy value that should also render as '-'
        valueFormatter: params => params.value || '-',
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'STATUS',
        field: 'status',
        cellRenderer: StatusBadgeCell,
        width: 120,
      },
      {
        headerName: 'LAST LOGIN',
        field: 'last_login_at',
        valueFormatter: params => this.formatDate(params.value),
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: 'ACTIONS',
        flex: 0,
        width: 200,
        minWidth: 200,
        maxWidth: 200,
        sortable: false,
        cellRenderer: ActionButtonsCell,
        cellRendererParams: {
          buttons: (data: User) => {
            const btns: ActionButtonConfig[] = [{ label: 'View', action: 'view' }];
            if (this.hasPermission('user.edit')) {
              btns.push({ label: 'Edit', action: 'edit' });
              if (data.status !== 'inactive') {
                btns.push({ label: 'Deactivate', action: 'deactivate', danger: true });
              }
            }
            return btns;
          },
          onClick: (action: string, data: User) => {
            if (action === 'view') this.viewUser.emit(data);
            if (action === 'edit') this.editUser.emit(data);
            if (action === 'deactivate') this.deactivateUser.emit(data);
          },
        },
      },
    );
  }

  onSelectionChanged(event: SelectionChangedEvent<User>): void {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedIds = selectedNodes.map(node => node.data?.id).filter((id): id is string => !!id);
    this.selectionChanged.emit(selectedIds);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Never';
    }
  }
}
