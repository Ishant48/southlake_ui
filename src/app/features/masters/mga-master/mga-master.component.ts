import {
  Component,
  inject,
  Input,
  Output,
  EventEmitter,
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
import { DropdownSearchComponent } from '../../../shared/components/dropdown-search/dropdown-search.component';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { StatusBadgeCellRenderer } from '../../../shared/components/grid-renderers/status-badge-cell.component';
import { MgaMaster, StateMaster } from '../../../core/models/master.model';

@Component({
  selector: 'app-mga-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent, DropdownSearchComponent],
  templateUrl: './mga-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MgaMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  @Output() docOpen = new EventEmitter<any>();
  @Output() addTreatiesFor = new EventEmitter<string>();

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  mgas: MgaMaster[] = [];
  stateOptions: StateMaster[] = [];
  loading = false;

  showMgaModal = false;
  mgaModalTitle = '';
  mgaForm: {
    id?: string;
    mga_code: string;
    name: string;
    tax_payable_inhouse: boolean;
    ledger_amount: number;
    is_active: boolean;
    company_id: number | null;
    id_name: string;
    address: string;
    zip: string;
    city: string;
    state: string;
    phone: string;
    open_item: boolean;
    op_start_date: string;
    other_names: { state: string; displayName: string }[];
    naics_code?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  } = {
    mga_code: '',
    name: '',
    tax_payable_inhouse: false,
    ledger_amount: 0,
    is_active: true,
    company_id: null,
    id_name: '',
    address: '',
    zip: '',
    city: '',
    state: '',
    phone: '',
    open_item: false,
    op_start_date: '',
    other_names: [],
    naics_code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  };

  isEditMode = false;
  submitting = false;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  stateAbbrLabelFn = (item: any) => (item ? `${item.state_abbr} - ${item.name}` : '');

  get columnDefs(): ColDef[] {
    return [
      { headerName: 'MGA CODE', field: 'mga_code', flex: 1, minWidth: 100, maxWidth: 120 },
      { headerName: 'MGA NAME', field: 'name', flex: 2, minWidth: 150 },
      { headerName: 'NAICS CODE', field: 'naics_code', flex: 1.2, minWidth: 120 },
      {
        headerName: 'TAX PAYABLE IN-HOUSE',
        field: 'tax_payable_inhouse',
        cellRenderer: StatusBadgeCellRenderer,
        flex: 1.5,
        minWidth: 150,
      },
      {
        headerName: 'STATUS',
        field: 'is_active',
        flex: 1,
        minWidth: 100,
        maxWidth: 120,
        cellRenderer: StatusBadgeCellRenderer,
      },
      {
        headerName: 'ACTIONS',
        cellRenderer: ActionButtonsCellRenderer,
        cellRendererParams: {
          buttons: [
            { label: 'Add Treaties', action: 'addTreaty' },
            { label: 'Document', action: 'doc' },
            { label: 'Edit', action: 'edit' },
            { label: 'Delete', action: 'delete', danger: true },
          ],
          onClick: (action: string, data: any) => {
            if (action === 'addTreaty') this.addTreatiesFor.emit(data.id);
            if (action === 'doc') this.docOpen.emit(data);
            if (action === 'edit') this.openMgaEdit(data);
            if (action === 'delete') this.deleteMga(data);
          },
        },
        flex: 0,
        width: 320,
        minWidth: 320,
        maxWidth: 320,
      },
    ];
  }

  ngOnInit(): void {
    this.loadData();
    this.service.getStates(undefined, true).subscribe({
      next: res => {
        this.stateOptions = res;
        this.cdr.markForCheck();
      },
    });
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

    this.service.getMgas(search, active).subscribe({
      next: res => {
        this.mgas = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load MGAs');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.mgaModalTitle = 'Add MGA';
    this.mgaForm = {
      mga_code: '',
      name: '',
      tax_payable_inhouse: false,
      ledger_amount: 0,
      is_active: true,
      company_id: null,
      id_name: '',
      address: '',
      zip: '',
      city: '',
      state: '',
      phone: '',
      open_item: false,
      op_start_date: '',
      other_names: [],
    };
    this.showMgaModal = true;
    this.cdr.markForCheck();
  }

  openMgaEdit(mga: MgaMaster): void {
    this.isEditMode = true;
    this.mgaModalTitle = `Edit MGA: ${mga.name}`;
    this.mgaForm = {
      id: mga.id,
      mga_code: mga.mga_code,
      name: mga.name,
      tax_payable_inhouse: mga.tax_payable_inhouse,
      ledger_amount: mga.ledger_amount || 0,
      is_active: mga.is_active,
      company_id: mga.company_id ? Number(mga.company_id) : null,
      id_name: mga.id_name || '',
      address: mga.address || '',
      zip: mga.zip || '',
      city: mga.city || '',
      state: mga.state || '',
      phone: mga.phone || '',
      open_item: mga.open_item || false,
      op_start_date: mga.op_start_date ? mga.op_start_date.substring(0, 10) : '',
      other_names: mga.other_names ? JSON.parse(JSON.stringify(mga.other_names)) : [],
    };
    this.showMgaModal = true;
    this.cdr.markForCheck();
  }

  addOtherNameRow(): void {
    if (!this.mgaForm.other_names) {
      this.mgaForm.other_names = [];
    }
    this.mgaForm.other_names.push({ state: '', displayName: '' });
    this.cdr.markForCheck();
  }

  removeOtherNameRow(index: number): void {
    if (this.mgaForm.other_names) {
      this.mgaForm.other_names.splice(index, 1);
    }
    this.cdr.markForCheck();
  }

  submitMga(): void {
    if (!this.mgaForm.mga_code || !this.mgaForm.name) {
      this.toast.error('MGA Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      ...this.mgaForm,
      ledger_amount: Number(this.mgaForm.ledger_amount || 0),
      company_id: this.mgaForm.company_id ? Number(this.mgaForm.company_id) : null,
      other_names:
        this.mgaForm.other_names && this.mgaForm.other_names.length > 0
          ? this.mgaForm.other_names
          : null,
    };

    if (this.isEditMode) {
      this.service.updateMga(this.mgaForm.id!, payload).subscribe({
        next: () => {
          this.toast.success('MGA updated successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.cdr.markForCheck();
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to update MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.service.createMga(payload).subscribe({
        next: () => {
          this.toast.success('MGA created successfully');
          this.showMgaModal = false;
          this.submitting = false;
          this.cdr.markForCheck();
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to create MGA');
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  deleteMga(mga: MgaMaster): void {
    this.confirmTitle = 'Delete MGA';
    this.confirmMessage = `Are you sure you want to delete MGA "${mga.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteMga(mga.id).subscribe({
        next: () => {
          this.toast.success('MGA deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete MGA');
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
    const headers = ['MGA Code', 'MGA Name', 'Tax Payable In-house', 'Ledger Amount', 'Status'];
    const rows = this.mgas.map(m => [
      m.mga_code,
      m.name,
      m.tax_payable_inhouse ? 'Yes' : 'No',
      m.ledger_amount !== undefined ? `$${m.ledger_amount.toFixed(2)}` : '$0.00',
      m.is_active ? 'Active' : 'Inactive',
    ]);
    this.downloadCSV(headers, rows, 'mgas.csv');
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
