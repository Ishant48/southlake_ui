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

@Component({
  selector: 'app-broker-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './broker-master.component.html',
  styleUrl: './broker-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrokerMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  brokers: any[] = [];
  loading = false;

  showBrokerModal = false;
  brokerModalTitle = '';
  isEditMode = false;
  submitting = false;

  brokerForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
  } = {
    code: '',
    name: '',
    is_active: true,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
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
      { headerName: 'BROKER CODE', field: 'brokerCode', flex: 1.5, minWidth: 120 },
      { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
      { headerName: 'CONTACT NAME', field: 'contactName', flex: 1.5, minWidth: 120 },
      { headerName: 'EMAIL', field: 'contactEmail', flex: 2, minWidth: 150 },
      { headerName: 'PHONE', field: 'contactPhone', flex: 1.5, minWidth: 120 },
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

    this.service.getBrokers(search, active).subscribe({
      next: res => {
        this.brokers = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Brokers');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.brokerModalTitle = 'Add New Broker';
    this.brokerForm = {
      code: '',
      name: '',
      is_active: true,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
    };
    this.showBrokerModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.brokerModalTitle = 'Edit Broker';
    this.brokerForm = {
      id: item.id,
      code: item.broker_code || item.code || '',
      name: item.name,
      is_active: item.is_active,
      contact_name: item.contact_name || item.contactName || '',
      contact_email: item.contact_email || item.contactEmail || '',
      contact_phone: item.contact_phone || item.contactPhone || '',
    };
    this.showBrokerModal = true;
    this.cdr.markForCheck();
  }

  submitBroker(): void {
    if (!this.brokerForm.code || !this.brokerForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      code: this.brokerForm.code,
      name: this.brokerForm.name,
      is_active: this.brokerForm.is_active,
      contact_name: this.brokerForm.contact_name || null,
      contact_email: this.brokerForm.contact_email || null,
      contact_phone: this.brokerForm.contact_phone || null,
    };

    const request = this.isEditMode
      ? this.service.updateBroker(this.brokerForm.id!, payload)
      : this.service.createBroker(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Broker saved successfully');
        this.showBrokerModal = false;
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
    this.confirmTitle = 'Delete Broker';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteBroker(item.id).subscribe({
        next: () => {
          this.toast.success('Broker deleted');
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
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';
    // broker has no export case defined in SimpleMasterComponent — preserved exactly
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
