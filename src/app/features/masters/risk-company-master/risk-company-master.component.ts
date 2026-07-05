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
import { RiskCompany, StateMaster } from '../../../core/models/master.model';

@Component({
  selector: 'app-risk-company-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent, DropdownSearchComponent],
  templateUrl: './risk-company-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskCompanyMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  @Output() docOpen = new EventEmitter<any>();
  @Output() notesOpen = new EventEmitter<{ title: string; text: string }>();

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  riskCompanies: RiskCompany[] = [];
  stateOptions: StateMaster[] = [];
  loading = false;

  showRiskCompanyModal = false;
  riskCompanyModalTitle = '';
  riskCompanyForm: {
    id?: string;
    risk_company_id: string;
    company_id: number | null;
    id_name: string;
    name: string;
    phone: string;
    is_admitted: boolean;
    state: string;
    address: string;
    zip: string;
    city: string;
    notes: string;
    is_active: boolean;
  } = {
    risk_company_id: '',
    company_id: null,
    id_name: '',
    name: '',
    phone: '',
    is_admitted: true,
    state: '',
    address: '',
    zip: '',
    city: '',
    notes: '',
    is_active: true,
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
      {
        headerName: 'COMPANY',
        valueGetter: p =>
          `${p.data.company_id}${p.data.risk_company_id ? ` (${p.data.risk_company_id})` : ''}`,
        flex: 1.5,
        minWidth: 150,
      },
      { headerName: 'ID NAME', field: 'id_name', flex: 1.5, minWidth: 150 },
      { headerName: 'NAME', field: 'name', flex: 3, minWidth: 200 },
      { headerName: 'PHONE', field: 'phone', flex: 1.5, minWidth: 120 },
      {
        headerName: 'ADMITTED',
        field: 'is_admitted',
        cellRenderer: StatusBadgeCellRenderer,
        flex: 1,
        minWidth: 100,
      },
      { headerName: 'STATE', field: 'state', flex: 1, minWidth: 80 },
      {
        headerName: 'ACTIONS',
        cellRenderer: ActionButtonsCellRenderer,
        cellRendererParams: {
          buttons: [
            { label: 'Document', action: 'doc' },
            { label: 'Notes', action: 'notes' },
            { label: 'View Policy', action: 'policy' },
            { label: 'Edit', action: 'edit' },
            { label: 'Delete', action: 'delete', danger: true },
          ],
          onClick: (action: string, data: any) => {
            if (action === 'doc') this.docOpen.emit(data);
            if (action === 'notes')
              this.notesOpen.emit({ title: 'Risk Company Notes: ' + data.name, text: data.notes });
            if (action === 'policy') this.viewPolicy(data);
            if (action === 'edit') this.openRiskCompanyEdit(data);
            if (action === 'delete') this.deleteRiskCompany(data);
          },
        },
        flex: 0,
        width: 360,
        minWidth: 360,
        maxWidth: 360,
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

    this.service.getRiskCompanies(search, active).subscribe({
      next: res => {
        this.riskCompanies = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Risk Companies');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.riskCompanyModalTitle = 'Add Risk Company';
    this.riskCompanyForm = {
      risk_company_id: '',
      company_id: null,
      id_name: '',
      name: '',
      phone: '',
      is_admitted: true,
      state: '',
      address: '',
      zip: '',
      city: '',
      notes: '',
      is_active: true,
    };
    this.showRiskCompanyModal = true;
    this.cdr.markForCheck();
  }

  openRiskCompanyEdit(rc: RiskCompany): void {
    this.isEditMode = true;
    this.riskCompanyModalTitle = `Edit Risk Company: ${rc.name}`;
    this.riskCompanyForm = {
      id: rc.id,
      risk_company_id: rc.risk_company_id,
      company_id: rc.company_id,
      id_name: rc.id_name || '',
      name: rc.name,
      phone: rc.phone || '',
      is_admitted: rc.is_admitted,
      state: rc.state || '',
      address: rc.address || '',
      zip: rc.zip || '',
      city: rc.city || '',
      notes: rc.notes || '',
      is_active: rc.is_active,
    };
    this.showRiskCompanyModal = true;
    this.cdr.markForCheck();
  }

  submitRiskCompany(): void {
    if (!this.riskCompanyForm.risk_company_id) {
      this.riskCompanyForm.risk_company_id = this.riskCompanyForm.company_id
        ? 'RC-' + this.riskCompanyForm.company_id
        : 'RC-' + Date.now();
    }
    if (!this.riskCompanyForm.name) {
      this.toast.error('Name is required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      risk_company_id: this.riskCompanyForm.risk_company_id,
      company_id: this.riskCompanyForm.company_id ? Number(this.riskCompanyForm.company_id) : null,
      id_name: this.riskCompanyForm.id_name || null,
      name: this.riskCompanyForm.name,
      phone: this.riskCompanyForm.phone || null,
      is_admitted: this.riskCompanyForm.is_admitted,
      state: this.riskCompanyForm.state || null,
      address: this.riskCompanyForm.address || null,
      zip: this.riskCompanyForm.zip || null,
      city: this.riskCompanyForm.city || null,
      notes: this.riskCompanyForm.notes || null,
      is_active: this.riskCompanyForm.is_active,
    };

    const request = this.isEditMode
      ? this.service.updateRiskCompany(this.riskCompanyForm.id!, payload)
      : this.service.createRiskCompany(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Risk Company saved successfully');
        this.showRiskCompanyModal = false;
        this.submitting = false;
        this.cdr.markForCheck();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save risk company');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteRiskCompany(rc: RiskCompany): void {
    this.confirmTitle = 'Delete Risk Company';
    this.confirmMessage = `Are you sure you want to delete risk company "${rc.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteRiskCompany(rc.id).subscribe({
        next: () => {
          this.toast.success('Risk Company deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete risk company');
        },
      });
    };
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  viewPolicy(rc: RiskCompany): void {
    this.toast.info(`View Policy clicked for risk company: ${rc.name}`);
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
    const headers = [
      'Company',
      'ID Name',
      'Name',
      'Phone',
      'Admitted',
      'State',
      'Address 1',
      'Zip',
      'City',
      'Status',
    ];
    const rows = this.riskCompanies.map(r => [
      r.company_id,
      r.id_name || '-',
      r.name,
      r.phone || '-',
      r.is_admitted ? 'Yes' : 'No',
      r.state || '-',
      r.address || '-',
      r.zip || '-',
      r.city || '-',
      r.is_active ? 'Active' : 'Inactive',
    ]);
    this.downloadCSV(headers, rows, 'risk_companies.csv');
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
    const escape = (val: any): string => {
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
