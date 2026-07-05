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
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { StatusBadgeCellRenderer } from '../../../shared/components/grid-renderers/status-badge-cell.component';
import { StateMaster } from '../../../core/models/master.model';

@Component({
  selector: 'app-state-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent],
  templateUrl: './state-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  @Output() docOpen = new EventEmitter<any>();
  @Output() notesOpen = new EventEmitter<{ title: string; text: string }>();

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  states: StateMaster[] = [];
  loading = false;

  showStateModal = false;
  stateModalTitle = '';
  stateForm: {
    id?: string;
    state_code: number | null;
    state_abbr: string;
    name: string;
    notes: string;
    is_active: boolean;
  } = { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };

  isEditMode = false;
  submitting = false;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  get columnDefs(): ColDef[] {
    return [
      { headerName: 'STATE CODE', field: 'state_code', flex: 1, minWidth: 100 },
      { headerName: 'STATE ABBR', field: 'state_abbr', flex: 1, minWidth: 100 },
      { headerName: 'STATE NAME', field: 'name', flex: 3, minWidth: 200 },
      {
        headerName: 'ACTIONS',
        cellRenderer: ActionButtonsCellRenderer,
        cellRendererParams: {
          buttons: [
            { label: 'Document', action: 'doc' },
            { label: 'Notes', action: 'notes' },
            { label: 'Edit', action: 'edit' },
            { label: 'Delete', action: 'delete', danger: true },
          ],
          onClick: (action: string, data: any) => {
            if (action === 'doc') this.docOpen.emit(data);
            if (action === 'notes')
              this.notesOpen.emit({ title: 'State Notes: ' + data.name, text: data.notes });
            if (action === 'edit') this.openStateEdit(data);
            if (action === 'delete') this.deleteState(data);
          },
        },
        flex: 0,
        width: 280,
        minWidth: 280,
        maxWidth: 280,
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

    this.service.getStates(search, active).subscribe({
      next: res => {
        this.states = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load States');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.stateModalTitle = 'Add State';
    this.stateForm = { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };
    this.showStateModal = true;
    this.cdr.markForCheck();
  }

  openStateEdit(state: StateMaster): void {
    this.isEditMode = true;
    this.stateModalTitle = `Edit State: ${state.name}`;
    this.stateForm = {
      id: state.id,
      state_code: state.state_code,
      state_abbr: state.state_abbr,
      name: state.name,
      notes: state.notes || '',
      is_active: state.is_active,
    };
    this.showStateModal = true;
    this.cdr.markForCheck();
  }

  submitState(): void {
    if (this.stateForm.state_code === null || !this.stateForm.state_abbr || !this.stateForm.name) {
      this.toast.error('State Code, State Abbr, and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      state_code: Number(this.stateForm.state_code),
      state_abbr: this.stateForm.state_abbr,
      name: this.stateForm.name,
      notes: this.stateForm.notes || null,
      is_active: this.stateForm.is_active,
    };

    const request = this.isEditMode
      ? this.service.updateState(this.stateForm.id!, payload)
      : this.service.createState(payload);

    request.subscribe({
      next: () => {
        this.toast.success('State saved successfully');
        this.showStateModal = false;
        this.submitting = false;
        this.cdr.markForCheck();
        this.loadData();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save state');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteState(state: StateMaster): void {
    this.confirmTitle = 'Delete State';
    this.confirmMessage = `Are you sure you want to delete state "${state.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteState(state.id).subscribe({
        next: () => {
          this.toast.success('State deleted successfully');
          this.loadData();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete state');
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
    const headers = ['State Code', 'State Abbr', 'State Name', 'Status'];
    const rows = this.states.map(s => [
      s.state_code,
      s.state_abbr,
      s.name,
      s.is_active ? 'Active' : 'Inactive',
    ]);
    this.downloadCSV(headers, rows, 'states.csv');
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
