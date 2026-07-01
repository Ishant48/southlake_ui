import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JournalEntriesService } from '../../core/services/journal-entries.service';
import { ChartOfAccountsService } from '../../core/services/chart-of-accounts.service';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../shared/components/dropdown-search/dropdown-search.component';
import { JournalEntryBatch, JournalEntry } from '../../core/models/journal-entry.model';
import { ChartOfAccount } from '../../core/models/chart-of-account.model';
import { ActionButtonsCellRenderer } from '../../shared/components/grid-renderers/action-buttons-cell.component';
import { ReinsuranceService } from '../../core/services/reinsurance.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { AgGridConfigService } from '../../core/services/ag-grid-config.service';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, DropdownSearchComponent, AgGridAngular],
  templateUrl: './journal-entries.component.html',
  styleUrl: './journal-entries.component.scss',
})
export class JournalEntriesComponent implements OnInit {
  private service = inject(JournalEntriesService);
  private coaService = inject(ChartOfAccountsService);
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reinsuranceService = inject(ReinsuranceService);
  private agGridConfig = inject(AgGridConfigService);

  gridOptions: GridOptions = this.agGridConfig.getDefaultGridOptions();

  batchColDefs: ColDef[] = [
    { headerName: '#', valueGetter: 'node.rowIndex + 1', width: 60, flex: 0 },
    { 
      headerName: 'BATCH', 
      field: 'batch_number', 
      cellRenderer: (params: any) => {
        const el = document.createElement('strong');
        el.className = 'text-link';
        el.innerText = params.value;
        el.style.cursor = 'pointer';
        el.onclick = () => this.viewBatchDetails(params.data);
        return el;
      },
      flex: 1, minWidth: 150
    },
    { headerName: 'AMOUNT', field: 'total_amount', valueFormatter: (params) => this.formatCurrency(params.value), flex: 1, minWidth: 150 },
    { headerName: 'COUNT', field: 'count', flex: 1, minWidth: 120 },
    { 
      headerName: 'ACTIONS', 
      cellRenderer: ActionButtonsCellRenderer,
      cellRendererParams: {
        buttons: (data: any) => [
          { label: 'Edit', action: 'edit' },
          { label: 'Journal Entry', action: 'je' },
          { label: 'Print Register', action: 'print' },
          { label: 'Delete', action: 'delete', danger: true }
        ],
        onClick: (action: string, data: any) => {
          if (action === 'edit' || action === 'je') this.viewBatchDetails(data);
          if (action === 'delete') {
            // Because deleteBatch expects a mouse event to stop propagation, we simulate or bypass it
            this.confirm('Delete Batch', `Are you sure you want to delete batch ${data.batch_number}?`, () => {
              this.service.deleteBatch(data.id).subscribe({
                next: () => {
                  this.toast.success(`Batch ${data.batch_number} deleted successfully`);
                  this.loadBatches();
                },
                error: () => this.toast.error('Failed to delete batch')
              });
            });
          }
        }
      },
      width: 320, minWidth: 320,
      flex: 0,
      sortable: false
    }
  ];

  entriesColDefs: ColDef[] = [
    { headerName: 'JOURNAL', field: 'je_number', flex: 1, minWidth: 120 },
    { headerName: 'DESCRIPTION', field: 'description', flex: 1, minWidth: 180 },
    { headerName: 'G/L', field: 'coa.account_code', flex: 1, minWidth: 120 },
    { headerName: 'SUB', field: 'sub', valueFormatter: p => p.value || '-', flex: 1, minWidth: 120 },
    { headerName: 'DEBIT', field: 'debit', valueFormatter: p => p.value ? this.formatCurrency(p.value) : '', flex: 1, minWidth: 120 },
    { headerName: 'CREDIT', field: 'credit', valueFormatter: p => p.value ? this.formatCurrency(p.value) : '', flex: 1, minWidth: 120 },
    { headerName: 'DATE', field: 'date', flex: 1, minWidth: 120 },
    { headerName: 'DP', field: 'dp', valueFormatter: p => p.value || '-', flex: 1, minWidth: 100 },
    { headerName: 'POLICY', field: 'policy', valueFormatter: p => p.value || '-', flex: 1, minWidth: 120 },
    { 
      headerName: 'ACTIONS',
      cellRenderer: ActionButtonsCellRenderer,
      cellRendererParams: {
        buttons: () => [{ label: 'Edit', action: 'edit' }],
        onClick: (action: string, data: any) => {
          if (action === 'edit') this.editJournalEntry(data);
        }
      },
      flex: 0,
      width: 100, minWidth: 100, maxWidth: 100,
      sortable: false
    }
  ];

  // View state
  currentView: 'list' | 'detail' | 'form' = 'list';
  isEditingForm = false;

  // Filters & Headers
  periods = ['June 2026', 'May 2026', 'April 2026'];
  selectedPeriod = 'June 2026';
  agentsList: string[] = ['Futuristic Underwriters LLC'];
  selectedAgent = 'Futuristic Underwriters LLC';
  totalBatchesAmount = 0;
  searchTerm = '';
  loading = false;

  // Batch register data
  batches: JournalEntryBatch[] = [];
  showAddBatchModal = false;
  newBatchNumber = '';
  submittingBatch = false;

  // Batch details view data
  selectedBatch: JournalEntryBatch | null = null;
  entries: JournalEntry[] = [];
  loadingEntries = false;

  // Form view data
  nextJeNumber = 1;
  formEntries: any[] = [];
  rowCounter = 0;
  coaOptions: ChartOfAccount[] = [];
  subOptions: string[] = ['705', 'MGA-100', 'MGA-200', 'AA'];
  subOptionsList: { id: string; name: string }[] = [
    { id: '705', name: '705' },
    { id: 'MGA-100', name: 'MGA-100' },
    { id: 'MGA-200', name: 'MGA-200' },
    { id: 'AA', name: 'AA' }
  ];
  coaLabelFn = (item: any) => item ? `${item.account_code} - ${item.description}` : '';
  subLabelFn = (item: any) => item ? item.name : '';
  submittingEntries = false;

  // Confirm dialog control
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadInitialData();
    this.checkQueryParameters();
  }

  checkQueryParameters(): void {
    this.route.queryParams.subscribe(params => {
      const batchId = params['batchId'];
      if (batchId) {
        this.service.getBatch(batchId).subscribe({
          next: (batch) => {
            this.selectedPeriod = batch.period;
            this.selectedAgent = batch.agent_name;
            this.viewBatchDetails(batch);
            this.cdr.markForCheck();
          },
          error: () => {
            this.toast.error('Failed to load journal batch from parameters');
          }
        });
      }
    });
  }

  loadInitialData(): void {
    // 1. Fetch all periods dynamically from batches first
    this.service.getBatches('', '', '').subscribe({
      next: (batches) => {
        if (batches.length > 0) {
          const uniquePeriods = Array.from(new Set(batches.map(b => b.period)));
          // Sort or reverse to show newest/oldest
          this.periods = uniquePeriods.sort((a, b) => b.localeCompare(a));
          if (!this.periods.includes(this.selectedPeriod)) {
            this.selectedPeriod = this.periods[0];
          }
        }

        // 2. Fetch active MGAs
        this.mastersService.getMgas('', true).subscribe({
          next: (res) => {
            if (res.length > 0) {
              this.agentsList = res.map(m => m.name);
              // Prefer 'Futuristic Underwriters LLC' or default to first
              const pref = this.agentsList.find(n => n.toLowerCase().includes('futuristic'));
              this.selectedAgent = pref || this.agentsList[0];
              // Use MGA codes as subledger codes
              this.subOptions = ['705', ...res.map(m => m.mga_code)];
              this.subOptionsList = this.subOptions.map(s => ({ id: s, name: s }));
            }
            this.loadBatches();
          },
          error: () => {
            this.toast.error('Failed to load MGAs, fallback to default');
            this.loadBatches();
          }
        });
      },
      error: () => {
        // Fallback to static loading
        this.mastersService.getMgas('', true).subscribe({
          next: (res) => {
            if (res.length > 0) {
              this.agentsList = res.map(m => m.name);
              const pref = this.agentsList.find(n => n.toLowerCase().includes('futuristic'));
              this.selectedAgent = pref || this.agentsList[0];
              this.subOptions = ['705', ...res.map(m => m.mga_code)];
              this.subOptionsList = this.subOptions.map(s => ({ id: s, name: s }));
            }
            this.loadBatches();
          },
          error: () => {
            this.toast.error('Failed to load MGAs, fallback to default');
            this.loadBatches();
          }
        });
      }
    });

    // 2. Fetch Chart of Accounts for the entries dropdown
    this.coaService.getAccounts('', true).subscribe({
      next: (res) => {
        // filter out parent accounts
        this.coaOptions = res.filter(a => !a.is_parent);
      },
      error: () => {
        this.toast.error('Failed to load Chart of Accounts');
      }
    });
  }

  loadBatches(): void {
    this.loading = true;
    this.service.getBatches(this.selectedPeriod, this.selectedAgent, this.searchTerm || undefined).subscribe({
      next: (res) => {
        this.batches = res;
        this.calculateTotalBatchesAmount();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load batches');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  calculateTotalBatchesAmount(): void {
    this.totalBatchesAmount = this.batches.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  }

  onFilterChange(): void {
    this.loadBatches();
  }

  openAddBatch(): void {
    this.newBatchNumber = '';
    this.showAddBatchModal = true;
  }

  closeAddBatch(): void {
    this.showAddBatchModal = false;
  }

  createBatch(): void {
    this.submittingBatch = true;
    this.service.createBatch({
      period: this.selectedPeriod,
      agent_name: this.selectedAgent,
    }).subscribe({
      next: (res) => {
        this.toast.success(`Batch ${res.batch_number} created successfully`);
        this.showAddBatchModal = false;
        this.submittingBatch = false;
        this.loadBatches();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to create batch';
        this.toast.error(msg);
        this.submittingBatch = false;
        this.cdr.markForCheck();
      }
    });
  }

  viewBatchDetails(batch: JournalEntryBatch): void {
    this.selectedBatch = batch;
    this.currentView = 'detail';
    this.loadBatchEntries();
  }

  loadBatchEntries(): void {
    if (!this.selectedBatch) return;
    this.loadingEntries = true;
    this.service.getBatchEntries(this.selectedBatch.id).subscribe({
      next: (res) => {
        this.entries = res;
        this.loadingEntries = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load entries');
        this.loadingEntries = false;
        this.cdr.markForCheck();
      }
    });
  }

  get batchTotalDebits(): number {
    return this.entries.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  }

  get batchTotalCredits(): number {
    return this.entries.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  }

  get batchDifference(): number {
    return Math.abs(this.batchTotalDebits - this.batchTotalCredits);
  }

  backToList(): void {
    this.selectedBatch = null;
    this.entries = [];
    this.currentView = 'list';
    this.loadBatches();
  }

  // ==========================================
  // ADD JOURNAL ENTRY FORM ACTIONS
  // ==========================================
  createBlankRow(values: Partial<any> = {}): any {
    const todayStr = new Date().toISOString().split('T')[0];
    this.rowCounter++;
    return {
      rowId: `row_${this.rowCounter}`,
      je_number: this.nextJeNumber,
      description: '',
      coa_id: '',
      sub: '',
      debit: null,
      credit: null,
      date: todayStr,
      dp: '',
      policy: '',
      memo: '',
      ...values
    };
  }

  openAddEntryForm(): void {
    if (!this.selectedBatch) return;
    this.isEditingForm = false;

    // Prefill the next JE Number (max JE Number + 1)
    if (this.entries.length > 0) {
      const maxJe = Math.max(...this.entries.map(e => e.je_number));
      this.nextJeNumber = maxJe + 1;
    } else {
      this.nextJeNumber = 1;
    }

    // Initialize with 2 blank rows
    this.formEntries = [
      this.createBlankRow(),
      this.createBlankRow()
    ];

    this.currentView = 'form';
  }

  editJournalEntry(entry: JournalEntry): void {
    if (!this.selectedBatch) return;
    this.isEditingForm = true;
    this.nextJeNumber = entry.je_number;

    // Filter matching lines by je_number
    const matchingEntries = this.entries.filter(e => e.je_number === entry.je_number);

    this.formEntries = matchingEntries.map(e => this.createBlankRow({
      je_number: e.je_number,
      description: e.description,
      coa_id: e.coa_id,
      sub: e.sub || '',
      debit: e.debit || null,
      credit: e.credit || null,
      date: e.date,
      dp: e.dp || '',
      policy: e.policy || '',
      memo: e.memo || '',
    }));

    this.currentView = 'form';
    this.cdr.markForCheck();
  }

  addRow(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    const prevRow = this.formEntries[this.formEntries.length - 1];

    const newRowConfig = {
      je_number: this.nextJeNumber,
      description: prevRow ? prevRow.description : '',
      coa_id: '',
      sub: prevRow ? prevRow.sub : '',
      debit: null,
      credit: null,
      date: prevRow ? prevRow.date : todayStr,
      dp: prevRow ? prevRow.dp : '',
      policy: prevRow ? prevRow.policy : '',
      memo: prevRow ? prevRow.memo : '',
    };

    // Create and push two more rows of same fields
    this.formEntries.push(this.createBlankRow(newRowConfig));
    this.formEntries.push(this.createBlankRow(newRowConfig));
  }

  copyRow(index: number): void {
    const source = this.formEntries[index];
    // Create copy with new rowId
    const duplicate = this.createBlankRow({
      ...source,
    });
    // Insert immediately after the source row
    this.formEntries.splice(index + 1, 0, duplicate);
  }

  deleteRow(index: number): void {
    if (this.formEntries.length > 1) {
      this.formEntries.splice(index, 1);
    } else {
      // Just clear the single remaining row
      this.formEntries[0] = this.createBlankRow();
    }
  }

  get formTotalDebits(): number {
    return this.formEntries.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }

  get formTotalCredits(): number {
    return this.formEntries.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }

  get formDifference(): number {
    return Math.abs(this.formTotalDebits - this.formTotalCredits);
  }

  get isFormBalanced(): boolean {
    const debits = Math.round((this.formTotalDebits + Number.EPSILON) * 100) / 100;
    const credits = Math.round((this.formTotalCredits + Number.EPSILON) * 100) / 100;
    return debits > 0 && debits === credits;
  }

  postJournalEntries(): void {
    if (!this.selectedBatch) return;

    // Validate inputs
    for (let i = 0; i < this.formEntries.length; i++) {
      const row = this.formEntries[i];
      if (!row.description.trim()) {
        this.toast.error(`Row ${i + 1}: Description is required`);
        return;
      }
      if (!row.coa_id) {
        this.toast.error(`Row ${i + 1}: G/L Number is required`);
        return;
      }
      const deb = Number(row.debit || 0);
      const cred = Number(row.credit || 0);
      if (deb === 0 && cred === 0) {
        this.toast.error(`Row ${i + 1}: Either Debit or Credit must be filled`);
        return;
      }
      if (deb > 0 && cred > 0) {
        this.toast.error(`Row ${i + 1}: Row cannot have both Debit and Credit amounts`);
        return;
      }
      if (row.je_number === null || row.je_number === undefined) {
        this.toast.error(`Row ${i + 1}: JE Number is required`);
        return;
      }
    }

    if (!this.isFormBalanced) {
      this.toast.error(`Journal Entry is not balanced. Difference: $${this.formDifference.toFixed(2)}`);
      return;
    }

    this.submittingEntries = true;

    const payload = {
      je_number: this.nextJeNumber,
      lines: this.formEntries.map(r => ({
        description: r.description.trim(),
        coa_id: r.coa_id,
        sub: r.sub || null,
        debit: r.debit !== null && r.debit !== '' ? Number(r.debit) : undefined,
        credit: r.credit !== null && r.credit !== '' ? Number(r.credit) : undefined,
        date: r.date,
        dp: r.dp || null,
        policy: r.policy || null,
        memo: r.memo || null,
      }))
    };

    this.service.postEntries(this.selectedBatch.id, payload).subscribe({
      next: () => {
        this.toast.success(`Journal Entry ${this.nextJeNumber} posted successfully`);
        this.submittingEntries = false;
        this.currentView = 'detail';
        // Refresh entries
        this.loadBatchEntries();
        // Reload details to update total amount and count
        if (this.selectedBatch) {
          this.service.getBatch(this.selectedBatch.id).subscribe({
            next: (b) => { this.selectedBatch = b; this.cdr.markForCheck(); }
          });
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to post entries';
        this.toast.error(msg);
        this.submittingEntries = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelForm(): void {
    this.currentView = 'detail';
  }

  // ==========================================
  // CONFIRM DELETION DIALOG ACTIONS
  // ==========================================
  deleteBatch(batch: JournalEntryBatch, event: MouseEvent): void {
    event.stopPropagation(); // Prevent opening batch details
    this.confirm('Delete Batch', `Are you sure you want to delete batch ${batch.batch_number}?`, () => {
      this.service.deleteBatch(batch.id).subscribe({
        next: () => {
          this.toast.success(`Batch ${batch.batch_number} deleted successfully`);
          this.loadBatches();
        },
        error: () => {
          this.toast.error('Failed to delete batch');
        }
      });
    });
  }

  confirm(title: string, message: string, action: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.pendingAction = action;
    this.confirmOpen = true;
  }

  onConfirmed(): void {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelled(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onUploadMonthlyExcel(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!this.selectedBatch) return;

      this.toast.info('Uploading monthly exhibit...');
      const formData = new FormData();
      formData.append('file', file);

      const url = `${this.reinsuranceService['apiUrl']}/workbooks/upload-to-batch/${this.selectedBatch.id}`;
      this.reinsuranceService['http'].post<any>(url, formData).subscribe({
        next: (res: any) => {
          this.toast.success('Successfully uploaded monthly exhibit and generated ceding entries.');
          this.loadBatchEntries();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          const msg = err.error?.message || 'Failed to upload monthly exhibit';
          this.toast.error(msg);
        }
      });
    }
  }

  onUploadITDExcel(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.toast.info('Uploading and seeding ITD baseline reserves...');
      
      this.reinsuranceService.uploadWorkbook(file, true).subscribe({
        next: () => {
          this.toast.success('ITD baseline reserves uploaded and seeded in database successfully.');
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          const msg = err.error?.message || 'Failed to seed ITD baseline';
          this.toast.error(msg);
        }
      });
    }
  }

  // Format Helper
  formatCurrency(value: number | string | null): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }
}
