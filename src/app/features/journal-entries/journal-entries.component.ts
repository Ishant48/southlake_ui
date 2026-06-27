import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalEntriesService } from '../../core/services/journal-entries.service';
import { ChartOfAccountsService } from '../../core/services/chart-of-accounts.service';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownSearchComponent } from '../../shared/components/dropdown-search/dropdown-search.component';
import { JournalEntryBatch, JournalEntry } from '../../core/models/journal-entry.model';
import { ChartOfAccount } from '../../core/models/chart-of-account.model';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent, DropdownSearchComponent],
  templateUrl: './journal-entries.component.html',
  styleUrl: './journal-entries.component.scss',
})
export class JournalEntriesComponent implements OnInit {
  private service = inject(JournalEntriesService);
  private coaService = inject(ChartOfAccountsService);
  private mastersService = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

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
  }

  loadInitialData(): void {
    // 1. Fetch active MGAs
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
    this.totalBatchesAmount = this.batches.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
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
    if (!this.newBatchNumber.trim()) {
      this.toast.error('Batch number is required');
      return;
    }

    this.submittingBatch = true;
    this.service.createBatch({
      batch_number: this.newBatchNumber.trim(),
      period: this.selectedPeriod,
      agent_name: this.selectedAgent,
    }).subscribe({
      next: (res) => {
        this.toast.success(`Batch ${res.batchNumber} created successfully`);
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
  openAddEntryForm(): void {
    if (!this.selectedBatch) return;
    this.isEditingForm = false;

    // Prefill the next JE Number (max JE Number + 1)
    if (this.entries.length > 0) {
      const maxJe = Math.max(...this.entries.map(e => e.jeNumber));
      this.nextJeNumber = maxJe + 1;
    } else {
      this.nextJeNumber = 1;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Initialize with 2 blank rows
    this.formEntries = [
      {
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
      },
      {
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
      }
    ];

    this.currentView = 'form';
  }

  editJournalEntry(entry: JournalEntry): void {
    if (!this.selectedBatch) return;
    this.isEditingForm = true;
    this.nextJeNumber = entry.jeNumber;

    // Filter matching lines by jeNumber
    const matchingEntries = this.entries.filter(e => e.jeNumber === entry.jeNumber);

    this.formEntries = matchingEntries.map(e => ({
      je_number: e.jeNumber,
      description: e.description,
      coa_id: e.coaId,
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

    this.formEntries.push({
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
    });
  }

  copyRow(index: number): void {
    const source = this.formEntries[index];
    // Create copy
    const duplicate = { ...source };
    // Insert immediately after the source row
    this.formEntries.splice(index + 1, 0, duplicate);
  }

  deleteRow(index: number): void {
    if (this.formEntries.length > 1) {
      this.formEntries.splice(index, 1);
    } else {
      // Just clear the single remaining row
      const todayStr = new Date().toISOString().split('T')[0];
      this.formEntries[0] = {
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
      };
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
    this.confirm('Delete Batch', `Are you sure you want to delete batch ${batch.batchNumber}?`, () => {
      this.service.deleteBatch(batch.id).subscribe({
        next: () => {
          this.toast.success(`Batch ${batch.batchNumber} deleted successfully`);
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

  // Format Helper
  formatCurrency(value: number | string | null): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }
}
