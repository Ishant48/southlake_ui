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
import { DropdownSearchComponent } from '../../../shared/components/dropdown-search/dropdown-search.component';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { StatusBadgeCellRenderer } from '../../../shared/components/grid-renderers/status-badge-cell.component';
import { LineOfBusiness, CobMaster } from '../../../core/models/master.model';

@Component({
  selector: 'app-product-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ConfirmDialogComponent, DropdownSearchComponent],
  templateUrl: './product-master.component.html',
  styleUrl: './product-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductMasterComponent implements OnInit {
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  products: any[] = [];
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];
  loading = false;

  showProductModal = false;
  productModalTitle = '';
  isEditMode = false;
  submitting = false;

  productForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
    description: string;
    lob_id: string;
    cob_id: string;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    lob_id: '',
    cob_id: '',
  };

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  lobLabelFn = (item: any) => (item ? `${item.name} (${item.lob_code})` : '');
  cobLabelFn = (item: any) => (item ? `${item.name} (${item.cob_code})` : '');

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
      { headerName: 'PRODUCT ID', field: 'productId', flex: 1.5, minWidth: 120 },
      { headerName: 'NAME', field: 'name', flex: 2, minWidth: 150 },
      { headerName: 'LOB', valueGetter: (p: any) => p.data.lob?.name || '-', flex: 1.5, minWidth: 120 },
      { headerName: 'COB', valueGetter: (p: any) => p.data.cob?.name || '-', flex: 1.5, minWidth: 120 },
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

    this.service.getProducts(search, active).subscribe({
      next: res => {
        this.products = res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load Products');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  openAdd(): void {
    this.isEditMode = false;
    this.productModalTitle = 'Add New Product';
    this.productForm = {
      code: '',
      name: '',
      is_active: true,
      description: '',
      lob_id: '',
      cob_id: '',
    };
    this.loadProductOptions();
    this.showProductModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.isEditMode = true;
    this.productModalTitle = 'Edit Product';
    this.productForm = {
      id: item.id,
      code: item.product_id || item.code || '',
      name: item.name,
      is_active: item.is_active,
      description: item.description || '',
      lob_id: item.lob_id || item.lobId || '',
      cob_id: item.cob_id || item.cobId || '',
    };
    this.loadProductOptions();
    this.showProductModal = true;
    this.cdr.markForCheck();
  }

  private loadProductOptions(): void {
    this.service.getLobs(undefined, true).subscribe({
      next: res => {
        this.lobOptions = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load LOB options');
      },
    });
    this.service.getCobs(undefined, true).subscribe({
      next: res => {
        this.cobOptions = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load COB options');
      },
    });
  }

  onProductLobCobChange(): void {
    const selectedLob = this.lobOptions.find(l => l.id === this.productForm.lob_id);
    const selectedCob = this.cobOptions.find(c => c.id === this.productForm.cob_id);
    const lobCode = selectedLob ? selectedLob.lob_code : '';
    const cobCode = selectedCob ? selectedCob.cob_code : '';
    if (lobCode && cobCode) {
      this.productForm.code = `${lobCode}-${cobCode}`;
      this.productForm.name = `${selectedLob?.name} - ${selectedCob?.name}`;
    } else {
      this.productForm.code = '';
      this.productForm.name = '';
    }
  }

  submitProduct(): void {
    if (!this.productForm.code || !this.productForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const payload: any = {
      code: this.productForm.code,
      name: this.productForm.name,
      is_active: this.productForm.is_active,
      description: this.productForm.description || null,
      lob_id: this.productForm.lob_id || null,
      cob_id: this.productForm.cob_id || null,
    };

    const request = this.isEditMode
      ? this.service.updateProduct(this.productForm.id!, payload)
      : this.service.createProduct(payload);

    request.subscribe({
      next: () => {
        this.toast.success('Product saved successfully');
        this.showProductModal = false;
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
    this.confirmTitle = 'Delete Product';
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteProduct(item.id).subscribe({
        next: () => {
          this.toast.success('Product deleted');
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
    // product has no export case defined in SimpleMasterComponent — preserved exactly
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
