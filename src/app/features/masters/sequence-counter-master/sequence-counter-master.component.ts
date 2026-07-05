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
import { SequencePrefixCounter } from '../../../core/models/master.model';

@Component({
  selector: 'app-sequence-counter-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './sequence-counter-master.component.html',
  styleUrl: './sequence-counter-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequenceCounterMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  sequencePrefixCounters: SequencePrefixCounter[] = [];
  loading = false;

  showSequenceCounterModal = false;
  sequenceCounterModalTitle = '';
  isEditMode = false;
  submitting = false;

  sequenceCounterForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
    description: string;
    prefix: string;
    next_value: number;
    padding_width: number;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    prefix: '',
    next_value: 1,
    padding_width: 4,
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
      { headerName: 'PREFIX', field: 'prefix', flex: 1, minWidth: 100 },
      {
        headerName: 'NEXT VALUE',
        valueGetter: (p: any) => p.data.next_value !== undefined ? p.data.next_value : p.data.nextValue,
        flex: 1,
        minWidth: 100,
      },
      {
        headerName: 'PADDING WIDTH',
        valueGetter: (p: any) => p.data.padding_width !== undefined ? p.data.padding_width : p.data.paddingWidth,
        flex: 1,
        minWidth: 100,
      },
      { headerName: 'DESCRIPTION', field: 'description', flex: 2.5, minWidth: 180 },
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

    this.service.getSequencePrefixCounters(search, active).subscribe({
      next: res => {
        this.sequencePrefixCounters = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Sequence Prefix & Counters');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.sequenceCounterModalTitle = 'Add New Sequence Prefix & Counter';
    this.sequenceCounterForm = {
      code: '',
      name: '',
      is_active: true,
      description: '',
      prefix: '',
      next_value: 1,
      padding_width: 4,
    };
    this.showSequenceCounterModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.sequenceCounterModalTitle = 'Edit Sequence Prefix & Counter';
    this.sequenceCounterForm = {
      id: item.id,
      code: item.code || '',
      name: item.name,
      is_active: item.is_active,
      description: item.description || '',
      prefix: item.prefix || '',
      next_value: item.next_value !== undefined ? item.next_value : item.nextValue || 1,
      padding_width: item.padding_width !== undefined ? item.padding_width : item.paddingWidth || 4,
    };
    this.showSequenceCounterModal = true;
    this.cdr.markForCheck();
  }

  submitSequenceCounter(): void {
    if (!this.sequenceCounterForm.code || !this.sequenceCounterForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      code: this.sequenceCounterForm.code,
      name: this.sequenceCounterForm.name,
      is_active: this.sequenceCounterForm.is_active,
      description: this.sequenceCounterForm.description || null,
      prefix: this.sequenceCounterForm.prefix || null,
      next_value: Number(this.sequenceCounterForm.next_value ?? 1),
      padding_width: Number(this.sequenceCounterForm.padding_width ?? 4),
    };

    const request = this.isEditMode
      ? this.service.updateSequencePrefixCounter(this.sequenceCounterForm.id!, payload)
      : this.service.createSequencePrefixCounter(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Sequence Prefix & Counter saved successfully');
        this.showSequenceCounterModal = false;
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
    this.confirmTitle = 'Delete Sequence Prefix & Counter';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteSequencePrefixCounter(item.id).subscribe({
        next: () => {
          this.toast.success('Sequence Prefix & Counter deleted');
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
    const headers = ['Code', 'Name', 'Prefix', 'Next Value', 'Padding Width', 'Description', 'Status'];
    const rows = this.sequencePrefixCounters.map(s => [
      s.code,
      s.name,
      s.prefix || '-',
      s.next_value !== undefined ? s.next_value : s.nextValue || 1,
      s.padding_width !== undefined ? s.padding_width : s.paddingWidth || 4,
      s.description || '-',
      s.isActive ? 'Active' : 'Inactive',
    ]);
    const filename = 'sequence_prefix_counters.csv';
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
