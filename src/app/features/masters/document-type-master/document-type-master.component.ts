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
import { DocumentType } from '../../../core/models/master.model';

@Component({
  selector: 'app-document-type-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './document-type-master.component.html',
  styleUrl: './document-type-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTypeMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  documentTypes: DocumentType[] = [];
  loading = false;

  showDocumentTypeModal = false;
  documentTypeModalTitle = '';
  isEditMode = false;
  submitting = false;

  documentTypeForm: {
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
      { headerName: 'CODE', field: 'code', flex: 1.5, minWidth: 120 },
      { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
      { headerName: 'DESCRIPTION', field: 'description', flex: 3, minWidth: 200 },
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

    this.service.getDocumentTypes(search, active).subscribe({
      next: res => {
        this.documentTypes = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Document Types');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.documentTypeModalTitle = 'Add New Document Type';
    this.documentTypeForm = {
      code: '',
      name: '',
      is_active: true,
    };
    this.showDocumentTypeModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.documentTypeModalTitle = 'Edit Document Type';
    this.documentTypeForm = {
      id: item.id,
      code: item.code || '',
      name: item.name,
      is_active: item.is_active,
    };
    this.showDocumentTypeModal = true;
    this.cdr.markForCheck();
  }

  submitDocumentType(): void {
    if (!this.documentTypeForm.code || !this.documentTypeForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      code: this.documentTypeForm.code,
      name: this.documentTypeForm.name,
      is_active: this.documentTypeForm.is_active,
    };

    const request = this.isEditMode
      ? this.service.updateDocumentType(this.documentTypeForm.id!, payload)
      : this.service.createDocumentType(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Document Type saved successfully');
        this.showDocumentTypeModal = false;
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
    this.confirmTitle = 'Delete Document Type';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteDocumentType(item.id).subscribe({
        next: () => {
          this.toast.success('Document Type deleted');
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
    const headers = ['Code', 'Name', 'Description', 'Status'];
    const rows = this.documentTypes.map(d => [
      d.code,
      d.name,
      d.description || '-',
      d.isActive ? 'Active' : 'Inactive',
    ]);
    const filename = 'document_types.csv';
    this.downloadCSV(headers, rows, filename);
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
