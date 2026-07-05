import {
  Component,
  inject,
  Input,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { StatusBadgeCellRenderer } from '../../../shared/components/grid-renderers/status-badge-cell.component';
import { ReinsurerCompany } from '../../../core/models/master.model';

@Component({
  selector: 'app-reinsurer-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './reinsurer-master.component.html',
  styleUrl: './reinsurer-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReinsurerMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  reinsurers: ReinsurerCompany[] = [];
  loading = false;

  showReinsurerModal = false;
  reinsurerModalTitle = '';
  isEditMode = false;
  submitting = false;

  reinsurerForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
  } = {
    code: '',
    name: '',
    is_active: true,
  };

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  get columnDefs(): ColDef[] {
    const statusCol: ColDef = {
      headerName: 'STATUS',
      field: 'is_active',
      flex: 1,
      minWidth: 100,
      maxWidth: 120,
      cellRenderer: StatusBadgeCellRenderer,
    };
    return [
      { headerName: 'CODE ID', field: 'reinsurer_company_id', flex: 1.5, minWidth: 120, maxWidth: 180 },
      { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
      statusCol,
      {
        headerName: 'ACTIONS',
        cellRenderer: ActionButtonsCellRenderer,
        cellRendererParams: {
          buttons: [
            { label: 'Edit', action: 'edit' },
            { label: 'Delete', action: 'delete', danger: true },
          ],
          onClick: (action: string, data: any) => {
            if (action === 'edit') this.openEdit(data);
            if (action === 'delete') this.deleteItem(data);
          },
        },
        flex: 0,
        width: 160,
        minWidth: 160,
        maxWidth: 160,
      },
    ];
  }

  ngOnInit(): void {
    this.loadData();
  }

  load(searchTerm: string, statusFilter: 'all' | 'active' | 'inactive'): void {
    this.searchTerm = searchTerm;
    this.statusFilter = statusFilter;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const search = this.searchTerm || undefined;
    const active =
      this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined;

    this.service.getReinsurers(search, active).subscribe({
      next: res => {
        this.reinsurers = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Reinsurers');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.reinsurerModalTitle = 'Add New Reinsurer Company';
    this.reinsurerForm = {
      code: '',
      name: '',
      is_active: true,
    };
    this.showReinsurerModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.reinsurerModalTitle = 'Edit Reinsurer Company';
    this.reinsurerForm = {
      id: item.id,
      code: item.reinsurer_company_id || '',
      name: item.name,
      is_active: item.is_active,
    };
    this.showReinsurerModal = true;
    this.cdr.markForCheck();
  }

  submitReinsurer(): void {
    if (!this.reinsurerForm.code || !this.reinsurerForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      reinsurer_company_id: this.reinsurerForm.code,
      name: this.reinsurerForm.name,
      is_active: this.reinsurerForm.is_active,
    };

    const request = this.isEditMode
      ? this.service.updateReinsurer(this.reinsurerForm.id!, payload)
      : this.service.createReinsurer(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Reinsurer Company saved successfully');
        this.showReinsurerModal = false;
        this.submitting = false;
        this.cdr.markForCheck();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save master data');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteItem(item: any): void {
    this.confirmTitle = 'Delete Reinsurer Company';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteReinsurer(item.id).subscribe({
        next: () => {
          this.toast.success('Reinsurer Company deleted');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete item');
        },
      });
    };
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  onConfirm(): void {
    if (this.pendingAction) this.pendingAction();
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  exportToExcel(): void {
    const headers = ['Code ID', 'Name', 'Status'];
    const rows = this.reinsurers.map(r => [
      r.reinsurer_company_id,
      r.name,
      r.is_active ? 'Active' : 'Inactive',
    ]);
    this.downloadCSV(headers, rows, 'reinsurers.csv');
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row =>
        row
          .map(val => {
            const str = val === null || val === undefined ? '' : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
