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
import { LineOfBusiness } from '../../../core/models/master.model';

@Component({
  selector: 'app-lob-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './lob-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  lobs: LineOfBusiness[] = [];
  loading = false;

  showLobModal = false;
  lobModalTitle = '';
  isEditMode = false;
  submitting = false;

  lobForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
    description: string;
    taxable: boolean;
    priority: number;
    fully_earned: boolean;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    taxable: false,
    priority: 1,
    fully_earned: false,
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
      { headerName: 'LOB CODE', field: 'lob_code', flex: 1, minWidth: 100, maxWidth: 120 },
      {
        headerName: 'LOB NAME',
        valueGetter: (p: any) => p.data.name,
        cellRenderer: (p: any) => {
          const desc = p.data.description
            ? `<div style="font-size: 11px; color: var(--gray-500); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;" title="${p.data.description}">${p.data.description}</div>`
            : '';
          return `<div style="line-height:1.2; margin-top:10px;"><div style="font-weight: 500;">${p.data.name}</div>${desc}</div>`;
        },
        flex: 3,
        minWidth: 200,
      },
      { headerName: 'TAXABLE', field: 'taxable', cellRenderer: StatusBadgeCellRenderer, flex: 1, minWidth: 100 },
      { headerName: 'PRIORITY', field: 'priority', flex: 1, minWidth: 100 },
      { headerName: 'FULLY EARNED', field: 'fully_earned', cellRenderer: StatusBadgeCellRenderer, flex: 1, minWidth: 120 },
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

    this.service.getLobs(search, active).subscribe({
      next: res => {
        this.lobs = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load LOBs');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.lobModalTitle = 'Add New Line of Business';
    this.lobForm = {
      code: '',
      name: '',
      is_active: true,
      description: '',
      taxable: false,
      priority: 1,
      fully_earned: false,
    };
    this.showLobModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.lobModalTitle = 'Edit Line of Business';
    this.lobForm = {
      id: item.id,
      code: item.lob_code || '',
      name: item.name,
      is_active: item.is_active,
      description: item.description || '',
      taxable: item.taxable || false,
      priority: item.priority || 1,
      fully_earned: item.fully_earned || false,
    };
    this.showLobModal = true;
    this.cdr.markForCheck();
  }

  submitLob(): void {
    if (!this.lobForm.code || !this.lobForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      lob_code: this.lobForm.code,
      name: this.lobForm.name,
      is_active: this.lobForm.is_active,
      description: this.lobForm.description || null,
      type: null,
      taxable: this.lobForm.taxable || false,
      priority: Number(this.lobForm.priority || 1),
      fully_earned: this.lobForm.fully_earned || false,
    };

    const request = this.isEditMode
      ? this.service.updateLob(this.lobForm.id!, payload)
      : this.service.createLob(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Line of Business saved successfully');
        this.showLobModal = false;
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
    this.confirmTitle = 'Delete Line of Business';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteLob(item.id).subscribe({
        next: () => {
          this.toast.success('Line of Business deleted');
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
    const headers = ['LOB Code', 'LOB Name', 'Taxable', 'Priority', 'Fully Earned', 'Status', 'Description'];
    const rows = this.lobs.map(l => [
      l.lob_code,
      l.name,
      l.taxable ? 'Yes' : 'No',
      l.priority,
      l.fully_earned ? 'Yes' : 'No',
      l.is_active ? 'Active' : 'Inactive',
      l.description || '-',
    ]);
    this.downloadCSV(headers, rows, 'lobs.csv');
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
