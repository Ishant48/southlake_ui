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
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { MastersService } from '../../../core/services/masters.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../../shared/components/dropdown-search/dropdown-search.component';
import { AgGridConfigService } from '../../../core/services/ag-grid-config.service';
import { ActionButtonsCellRenderer } from '../../../shared/components/grid-renderers/action-buttons-cell.component';
import { StatusBadgeCellRenderer } from '../../../shared/components/grid-renderers/status-badge-cell.component';
import {
  LineOfBusiness,
  CobMaster,
  ReinsurerCompany,
  DocumentType,
  SequencePrefixCounter,
} from '../../../core/models/master.model';

type SimpleMode =
  | 'lob'
  | 'cob'
  | 'reinsurer'
  | 'broker'
  | 'product'
  | 'document-type'
  | 'sequence-prefix-counter';

@Component({
  selector: 'app-simple-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    ConfirmDialogComponent,
    DropdownSearchComponent,
  ],
  templateUrl: './simple-master.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleMasterComponent implements OnInit {
  @Input() mode: SimpleMode = 'lob';
  @Input() searchTerm = '';
  @Input() statusFilter: 'all' | 'active' | 'inactive' = 'all';

  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private agGridConfig = inject(AgGridConfigService);

  // Data lists
  lobs: LineOfBusiness[] = [];
  cobs: CobMaster[] = [];
  reinsurers: ReinsurerCompany[] = [];
  brokers: any[] = [];
  products: any[] = [];
  documentTypes: DocumentType[] = [];
  sequencePrefixCounters: SequencePrefixCounter[] = [];

  // Product form options (loaded on-demand when mode === 'product')
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];

  loading = false;

  // Simple Modal state
  showSimpleModal = false;
  simpleModalTitle = '';
  simpleMode: SimpleMode = 'lob';
  isEditMode = false;
  submitting = false;

  simpleForm: {
    id?: string;
    code: string;
    name: string;
    is_active: boolean;
    description: string;
    type: string;
    taxable: boolean;
    priority: number;
    fully_earned: boolean;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    lob_id?: string;
    cob_id?: string;
    prefix?: string;
    next_value?: number;
    padding_width?: number;
  } = {
    code: '',
    name: '',
    is_active: true,
    description: '',
    type: '',
    taxable: false,
    priority: 1,
    fully_earned: false,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    lob_id: '',
    cob_id: '',
    prefix: '',
    next_value: 1,
    padding_width: 4,
  };

  simpleFormTypeOptions = [
    { id: 'Property', name: 'Property' },
    { id: 'Liability', name: 'Liability' },
    { id: 'Automobile', name: 'Automobile' },
    { id: 'Workers Comp', name: 'Workers Comp' },
    { id: 'Other', name: 'Other' },
  ];

  // Confirm dialog
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  // Label functions
  lobLabelFn = (item: any) => (item ? `${item.name} (${item.lob_code})` : '');
  cobLabelFn = (item: any) => (item ? `${item.name} (${item.cob_code})` : '');
  nameLabelFn = (item: any) => (item ? item.name : '');

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  get currentList(): any[] {
    switch (this.mode) {
      case 'lob': return this.lobs;
      case 'cob': return this.cobs;
      case 'reinsurer': return this.reinsurers;
      case 'broker': return this.brokers;
      case 'product': return this.products;
      case 'document-type': return this.documentTypes;
      case 'sequence-prefix-counter': return this.sequencePrefixCounters;
      default: return [];
    }
  }

  get columnDefs(): ColDef[] {
    const statusCol: ColDef = {
      headerName: 'STATUS',
      field: 'is_active',
      flex: 1,
      minWidth: 100,
      maxWidth: 120,
      cellRenderer: StatusBadgeCellRenderer,
    };

    switch (this.mode) {
      case 'lob':
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

      case 'cob':
        return [
          { headerName: 'CLASS CODE', field: 'cob_code', flex: 1, minWidth: 100, maxWidth: 120 },
          {
            headerName: 'CLASS NAME',
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
          { headerName: 'CLASS TYPE', field: 'type', flex: 1.5, minWidth: 120 },
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

      case 'reinsurer':
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

      case 'broker':
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

      case 'product':
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

      case 'document-type':
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

      case 'sequence-prefix-counter':
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

      default:
        return [];
    }
  }

  ngOnInit(): void {
    this.simpleMode = this.mode;
    this.loadMasters();
  }

  load(mode: SimpleMode, searchTerm: string, statusFilter: 'all' | 'active' | 'inactive'): void {
    this.mode = mode;
    this.simpleMode = mode;
    this.searchTerm = searchTerm;
    this.statusFilter = statusFilter;
    this.loadMasters();
  }

  loadMasters(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const search = this.searchTerm || undefined;
    const active =
      this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined;

    switch (this.mode) {
      case 'lob':
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
        break;
      case 'cob':
        this.service.getCobs(search, active).subscribe({
          next: res => {
            this.cobs = res;
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load COBs');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
        break;
      case 'reinsurer':
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
        break;
      case 'broker':
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
        break;
      case 'product':
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
        break;
      case 'document-type':
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
        break;
      case 'sequence-prefix-counter':
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
        break;
    }
  }

  openAdd(): void {
    this.simpleMode = this.mode;
    this.isEditMode = false;
    this.simpleModalTitle = `Add New ${this.getMasterLabel(this.mode)}`;
    this.simpleForm = {
      code: '',
      name: '',
      is_active: true,
      description: '',
      type: '',
      taxable: false,
      priority: 1,
      fully_earned: false,
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      lob_id: '',
      cob_id: '',
      prefix: '',
      next_value: 1,
      padding_width: 4,
    };
    if (this.mode === 'product') {
      this.loadProductOptions();
    }
    this.showSimpleModal = true;
    this.cdr.markForCheck();
  }

  openEdit(item: any): void {
    this.simpleMode = this.mode;
    this.isEditMode = true;
    this.simpleModalTitle = `Edit ${this.getMasterLabel(this.mode)}`;
    this.simpleForm = {
      id: item.id,
      code:
        item.lob_code ||
        item.cob_code ||
        item.reinsurer_company_id ||
        item.broker_code ||
        item.product_id ||
        item.code ||
        '',
      name: item.name,
      is_active: item.is_active,
      description: item.description || '',
      type: item.type || '',
      taxable: item.taxable || false,
      priority: item.priority || 1,
      fully_earned: item.fully_earned || false,
      contact_name: item.contact_name || item.contactName || '',
      contact_email: item.contact_email || item.contactEmail || '',
      contact_phone: item.contact_phone || item.contactPhone || '',
      lob_id: item.lob_id || item.lobId || '',
      cob_id: item.cob_id || item.cobId || '',
      prefix: item.prefix || '',
      next_value: item.next_value !== undefined ? item.next_value : item.nextValue || 1,
      padding_width: item.padding_width !== undefined ? item.padding_width : item.paddingWidth || 4,
    };
    if (this.mode === 'product') {
      this.loadProductOptions();
    }
    this.showSimpleModal = true;
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
    const selectedLob = this.lobOptions.find(l => l.id === this.simpleForm.lob_id);
    const selectedCob = this.cobOptions.find(c => c.id === this.simpleForm.cob_id);
    const lobCode = selectedLob ? selectedLob.lob_code : '';
    const cobCode = selectedCob ? selectedCob.cob_code : '';
    if (lobCode && cobCode) {
      this.simpleForm.code = `${lobCode}-${cobCode}`;
      this.simpleForm.name = `${selectedLob?.name} - ${selectedCob?.name}`;
    } else {
      this.simpleForm.code = '';
      this.simpleForm.name = '';
    }
  }

  submitSimple(): void {
    if (!this.simpleForm.code || !this.simpleForm.name) {
      this.toast.error('Code and Name are required');
      return;
    }
    this.submitting = true;
    this.cdr.markForCheck();

    const codeKey = this.getCodeKey(this.simpleMode);
    const payload: any = {
      [codeKey]: this.simpleForm.code,
      name: this.simpleForm.name,
      is_active: this.simpleForm.is_active,
    };

    if (this.simpleMode === 'lob' || this.simpleMode === 'cob') {
      payload.description = this.simpleForm.description || null;
      payload.type = this.simpleMode === 'cob' ? this.simpleForm.type || null : null;
      payload.taxable = this.simpleForm.taxable || false;
      payload.priority = Number(this.simpleForm.priority || 1);
      payload.fully_earned = this.simpleForm.fully_earned || false;
    } else if (this.simpleMode === 'broker') {
      payload.contact_name = this.simpleForm.contact_name || null;
      payload.contact_email = this.simpleForm.contact_email || null;
      payload.contact_phone = this.simpleForm.contact_phone || null;
    } else if (this.simpleMode === 'product') {
      payload.description = this.simpleForm.description || null;
      payload.lob_id = this.simpleForm.lob_id || null;
      payload.cob_id = this.simpleForm.cob_id || null;
    } else if (this.simpleMode === 'sequence-prefix-counter') {
      payload.description = this.simpleForm.description || null;
      payload.prefix = this.simpleForm.prefix || null;
      payload.next_value = Number(this.simpleForm.next_value ?? 1);
      payload.padding_width = Number(this.simpleForm.padding_width ?? 4);
    }

    let request!: Observable<any>;
    if (this.isEditMode) {
      const id = this.simpleForm.id!;
      switch (this.simpleMode) {
        case 'lob':
          request = this.service.updateLob(id, payload);
          break;
        case 'cob':
          request = this.service.updateCob(id, payload);
          break;
        case 'reinsurer':
          request = this.service.updateReinsurer(id, payload);
          break;
        case 'broker':
          request = this.service.updateBroker(id, payload);
          break;
        case 'product':
          request = this.service.updateProduct(id, payload);
          break;
        case 'document-type':
          request = this.service.updateDocumentType(id, payload);
          break;
        case 'sequence-prefix-counter':
          request = this.service.updateSequencePrefixCounter(id, payload);
          break;
      }
    } else {
      switch (this.simpleMode) {
        case 'lob':
          request = this.service.createLob(payload);
          break;
        case 'cob':
          request = this.service.createCob(payload);
          break;
        case 'reinsurer':
          request = this.service.createReinsurer(payload);
          break;
        case 'broker':
          request = this.service.createBroker(payload);
          break;
        case 'product':
          request = this.service.createProduct(payload);
          break;
        case 'document-type':
          request = this.service.createDocumentType(payload);
          break;
        case 'sequence-prefix-counter':
          request = this.service.createSequencePrefixCounter(payload);
          break;
      }
    }

    request.subscribe({
      next: () => {
        this.toast.success(`${this.getMasterLabel(this.simpleMode)} saved successfully`);
        this.showSimpleModal = false;
        this.submitting = false;
        this.cdr.markForCheck();
        this.loadMasters();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to save master data');
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteItem(item: any): void {
    this.confirmTitle = `Delete ${this.getMasterLabel(this.mode)}`;
    this.confirmMessage = `Are you sure you want to delete "${item.name}"? This action cannot be undone.`;
    this.pendingAction = () => {
      let request!: Observable<any>;
      switch (this.mode) {
        case 'lob':
          request = this.service.deleteLob(item.id);
          break;
        case 'cob':
          request = this.service.deleteCob(item.id);
          break;
        case 'reinsurer':
          request = this.service.deleteReinsurer(item.id);
          break;
        case 'broker':
          request = this.service.deleteBroker(item.id);
          break;
        case 'product':
          request = this.service.deleteProduct(item.id);
          break;
        case 'document-type':
          request = this.service.deleteDocumentType(item.id);
          break;
        case 'sequence-prefix-counter':
          request = this.service.deleteSequencePrefixCounter(item.id);
          break;
      }
      request.subscribe({
        next: () => {
          this.toast.success(`${this.getMasterLabel(this.mode)} deleted`);
          this.loadMasters();
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

    switch (this.mode) {
      case 'lob':
        headers = ['LOB Code', 'LOB Name', 'Taxable', 'Priority', 'Fully Earned', 'Status', 'Description'];
        rows = this.lobs.map(l => [
          l.lob_code,
          l.name,
          l.taxable ? 'Yes' : 'No',
          l.priority,
          l.fully_earned ? 'Yes' : 'No',
          l.is_active ? 'Active' : 'Inactive',
          l.description || '-',
        ]);
        filename = 'lobs.csv';
        break;
      case 'cob':
        headers = [
          'Class Code',
          'Class Name',
          'Class Type',
          'Taxable',
          'Priority',
          'Fully Earned',
          'Status',
          'Description',
        ];
        rows = this.cobs.map(c => [
          c.cob_code,
          c.name,
          c.type || '-',
          c.taxable ? 'Yes' : 'No',
          c.priority,
          c.fully_earned ? 'Yes' : 'No',
          c.is_active ? 'Active' : 'Inactive',
          c.description || '-',
        ]);
        filename = 'cobs.csv';
        break;
      case 'reinsurer':
        headers = ['Code ID', 'Name', 'Status'];
        rows = this.reinsurers.map(r => [
          r.reinsurer_company_id,
          r.name,
          r.is_active ? 'Active' : 'Inactive',
        ]);
        filename = 'reinsurers.csv';
        break;
      case 'document-type':
        headers = ['Code', 'Name', 'Description', 'Status'];
        rows = this.documentTypes.map(d => [
          d.code,
          d.name,
          d.description || '-',
          d.isActive ? 'Active' : 'Inactive',
        ]);
        filename = 'document_types.csv';
        break;
      case 'sequence-prefix-counter':
        headers = ['Code', 'Name', 'Prefix', 'Next Value', 'Padding Width', 'Description', 'Status'];
        rows = this.sequencePrefixCounters.map(s => [
          s.code,
          s.name,
          s.prefix || '-',
          s.next_value !== undefined ? s.next_value : s.nextValue || 1,
          s.padding_width !== undefined ? s.padding_width : s.paddingWidth || 4,
          s.description || '-',
          s.isActive ? 'Active' : 'Inactive',
        ]);
        filename = 'sequence_prefix_counters.csv';
        break;
    }

    this.downloadCSV(headers, rows, filename);
  }

  private getMasterLabel(mode: SimpleMode): string {
    switch (mode) {
      case 'lob':
        return 'Line of Business';
      case 'cob':
        return 'Class of Business';
      case 'reinsurer':
        return 'Reinsurer Company';
      case 'broker':
        return 'Broker';
      case 'product':
        return 'Product';
      case 'document-type':
        return 'Document Type';
      case 'sequence-prefix-counter':
        return 'Sequence Prefix & Counter';
      default:
        return 'Master';
    }
  }

  private getCodeKey(mode: SimpleMode): string {
    switch (mode) {
      case 'lob':
        return 'lob_code';
      case 'cob':
        return 'cob_code';
      case 'reinsurer':
        return 'reinsurer_company_id';
      default:
        return 'code';
    }
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
