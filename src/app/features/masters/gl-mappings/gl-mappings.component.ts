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
import { GlMappingsService } from '../services/gl-mappings.service';
import { ChartOfAccountsService } from '../../../core/services/chart-of-accounts.service';
import { GlMapping } from '../../../core/models/gl-mapping.model';
import { ChartOfAccount } from '../../../core/models/chart-of-account.model';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../../shared/components/dropdown-search/dropdown-search.component';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';

@Component({
  selector: 'app-gl-mappings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    ConfirmDialogComponent,
    DropdownSearchComponent,
  ],
  templateUrl: './gl-mappings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlMappingsComponent implements OnInit {
  @Input() searchTerm = '';

  private glMappingsService = inject(GlMappingsService);
  private coaService = inject(ChartOfAccountsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  glMappings: GlMapping[] = [];
  coaOptions: ChartOfAccount[] = [];
  showGlMappingModal = false;
  glMappingModalTitle = 'Add GL Mapping';
  glMappingForm: Partial<GlMapping> = { coa_id: '', type: '' };
  glMappingTypeOptionsList = [
    { id: 'AR', name: 'AR' },
    { id: 'AP', name: 'AP' },
    { id: 'MGA', name: 'MGA' },
    { id: 'BRK', name: 'BRK' },
  ];
  loading = false;
  isEditMode = false;
  submitting = false;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  coaLabelFn = (item: any) => (item ? `${item.account_code} - ${item.description}` : '');
  nameLabelFn = (item: any) => (item ? item.name : '');

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  columnDefs: ColDef[] = [
    {
      headerName: 'GL NUMBER',
      valueGetter: (p: any) => this.getGLNumberDisplay(p.data),
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'TYPE',
      field: 'type',
      cellRenderer: (p: any) =>
        `<span class="type-badge ${p.value?.toLowerCase()}">${p.value}</span>`,
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCellRenderer,
      cellRendererParams: {
        buttons: [
          { label: 'Edit', action: 'edit' },
          { label: 'Delete', action: 'delete', danger: true },
        ],
        onClick: (action: string, data: any) => {
          if (action === 'edit') this.openGlMappingEdit(data);
          if (action === 'delete') this.deleteGlMapping(data);
        },
      },
      flex: 0,
      width: 160,
      minWidth: 160,
      maxWidth: 160,
    },
  ];

  ngOnInit(): void {
    this.loadGlMappings();
  }

  load(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.loadGlMappings();
  }

  exportToExcel(): void {
    const headers = ['GL Number', 'Type'];
    const rows = this.glMappings.map(m => [this.getGLNumberDisplay(m), m.type]);
    this.downloadCSV(headers, rows, 'gl_mappings.csv');
  }

  loadGlMappings(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.glMappingsService.getMappings().subscribe({
      next: data => {
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          this.glMappings = data.filter(m => {
            const typeMatch = m.type.toLowerCase().includes(term);
            const code = m.coa?.account_code?.toString() || '';
            const desc = m.coa?.description?.toLowerCase() || '';
            return typeMatch || code.includes(term) || desc.includes(term);
          });
        } else {
          this.glMappings = data;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load GL mappings');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadCoaOptions(): void {
    this.coaService.getAccounts(undefined, true).subscribe({
      next: data => {
        this.coaOptions = data.filter(coa => !coa.is_parent);
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Chart of Accounts options');
      },
    });
  }

  openGlMappingAdd(): void {
    this.isEditMode = false;
    this.glMappingModalTitle = 'Add GL Mapping';
    this.glMappingForm = { coa_id: '', type: '' };
    this.loadCoaOptions();
    this.showGlMappingModal = true;
    this.cdr.markForCheck();
  }

  openGlMappingEdit(mapping: GlMapping): void {
    this.isEditMode = true;
    this.glMappingModalTitle = 'Edit GL Mapping';
    this.glMappingForm = {
      id: mapping.id,
      coa_id: mapping.coa_id,
      type: mapping.type,
    };
    this.loadCoaOptions();
    this.showGlMappingModal = true;
    this.cdr.markForCheck();
  }

  submitGlMapping(): void {
    if (!this.glMappingForm.coa_id || !this.glMappingForm.type) {
      this.toast.error('Both Chart of Account and Mapping Type are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload = {
      coa_id: this.glMappingForm.coa_id,
      type: this.glMappingForm.type,
    };

    if (this.isEditMode && this.glMappingForm.id) {
      this.glMappingsService.updateMapping(this.glMappingForm.id, payload).subscribe({
        next: () => {
          this.toast.success('GL Mapping updated successfully');
          this.showGlMappingModal = false;
          this.submitting = false;
          this.cdr.markForCheck();
          this.loadGlMappings();
        },
        error: err => {
          const msg = err.error?.message || 'Failed to update GL mapping';
          this.toast.error(msg);
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.glMappingsService.createMapping(payload).subscribe({
        next: () => {
          this.toast.success('GL Mapping created successfully');
          this.showGlMappingModal = false;
          this.submitting = false;
          this.cdr.markForCheck();
          this.loadGlMappings();
        },
        error: err => {
          const msg = err.error?.message || 'Failed to create GL mapping';
          this.toast.error(msg);
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  deleteGlMapping(mapping: GlMapping): void {
    this.confirmOpen = true;
    this.pendingAction = () => {
      this.glMappingsService.deleteMapping(mapping.id).subscribe({
        next: () => {
          this.toast.success('GL Mapping deleted successfully');
          this.loadGlMappings();
        },
        error: () => {
          this.toast.error('Failed to delete GL mapping');
        },
      });
    };
    this.cdr.markForCheck();
  }

  getGLNumberDisplay(mapping: GlMapping): string {
    if (!mapping.coa) return '-';
    return `${mapping.coa.account_code} - ${mapping.coa.description}`;
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
