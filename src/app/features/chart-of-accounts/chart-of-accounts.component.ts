import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartOfAccountsService } from '../../core/services/chart-of-accounts.service';
import { ChartOfAccount, ChartOfAccountDocument } from '../../core/models/chart-of-account.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chart-of-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './chart-of-accounts.component.html',
  styleUrl: './chart-of-accounts.component.scss',
})
export class ChartOfAccountsComponent implements OnInit {
  private service = inject(ChartOfAccountsService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  flatAccounts: ChartOfAccount[] = [];
  rootParents: ChartOfAccount[] = []; // Predefined 5 roots
  subCoas: any[] = []; // List of COAs (roots and subs) displayed in table
  loading = false;
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  typeFilter: string = 'all';
  earningAccountCode: number | null = null;

  // Pagination
  pageSize = 25;
  currentPage = 1;

  // Notes Modal
  showNotesModal = false;
  notesModalTitle = '';
  notesModalContent = '';

  // Account Modal control
  showModal = false;
  modalTitle = '';
  isEditMode = false;
  isViewMode = false;
  submitting = false;

  // Form Binding Data (uses snake_case properties now)
  accountForm: Partial<ChartOfAccount> = {
    account_code: undefined,
    key: '',
    description: '',
    parent_id: null,
    is_parent: true, // Sub COAs are category parents by default
    normal_balance: 'debit',
    next_number: undefined,
    notes: '',
    is_active: true,
  };

  // Document Management Drawer
  showDocModal = false;
  selectedAccount: ChartOfAccount | null = null;
  documents: ChartOfAccountDocument[] = [];
  uploadingDoc = false;

  // Confirm dialog control
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    this.service.getAccounts(
      this.searchTerm || undefined,
      this.statusFilter === 'all' ? undefined : this.statusFilter === 'active'
    ).subscribe({
      next: (accounts) => {
        this.flatAccounts = accounts;

        // Resolve top-level parent accounts if they are present or not cached
        const hasRoots = accounts.some(a => Number(a.account_code) === 110000);
        if (hasRoots || this.rootParents.length === 0) {
          this.rootParents = [
            accounts.find(a => Number(a.account_code) === 110000), // Assets
            accounts.find(a => Number(a.account_code) === 210000), // Liability
            accounts.find(a => Number(a.account_code) === 310000), // Capital and Equity
            accounts.find(a => Number(a.account_code) === 410000), // Revenue
            accounts.find(a => Number(a.account_code) === 510000), // Expense
          ].filter(Boolean) as ChartOfAccount[];
        }

        // Build the nested/hierarchical flat list to display in the table
        this.subCoas = this.buildTreeList(accounts);

        this.currentPage = 1;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to load chart of accounts');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  buildTreeList(accounts: ChartOfAccount[]): any[] {
    const rootCodes = [110000, 210000, 310000, 410000, 510000];
    const roots = accounts.filter(a => rootCodes.includes(Number(a.account_code)));

    const rootOrder: { [code: number]: number } = {
      110000: 1, // Assets
      210000: 2, // Liability
      310000: 3, // Capital and Equity
      410000: 4, // Revenue
      510000: 5  // Expense
    };

    roots.sort((a, b) => {
      const orderA = rootOrder[Number(a.account_code)] || 99;
      const orderB = rootOrder[Number(b.account_code)] || 99;
      return orderA - orderB;
    });

    const result: any[] = [];

    const traverse = (node: ChartOfAccount, depth: number) => {
      const isRoot = node.is_parent;
      result.push({
        ...node,
        is_root: isRoot,
        treeDepth: depth
      });

      // Find children
      const children = accounts.filter(a => a.parent_id === node.id);
      children.sort((a, b) => Number(a.account_code) - Number(b.account_code));

      for (const child of children) {
        traverse(child, depth + 1);
      }
    };

    for (const root of roots) {
      traverse(root, 0);
    }

    // Capture stray accounts to avoid losing data
    const visitedIds = new Set(result.map(r => r.id));
    const strays = accounts.filter(a => !visitedIds.has(a.id));
    if (strays.length > 0) {
      strays.sort((a, b) => Number(a.account_code) - Number(b.account_code));
      for (const s of strays) {
        result.push({
          ...s,
          is_root: false,
          treeDepth: 0
        });
      }
    }

    return result;
  }

  // Helper mappings
  getParentCoaId(coa: ChartOfAccount): string {
    if (!coa.parent_id) return '-';
    const parent = this.flatAccounts.find(p => p.id === coa.parent_id);
    return parent ? String(parent.account_code) : '-';
  }

  getParentCoaDisplay(root: ChartOfAccount): string {
    const code = Number(root.account_code);
    if (code === 110000) return '110000 - Assets';
    if (code === 210000) return '210000 - Liability';
    if (code === 310000) return '310000 - Capital and Equity';
    if (code === 410000) return '410000 - Revenue';
    if (code === 510000) return '510000 - Expense';
    return `${code} - ${root.description}`;
  }

  // Client-side pagination helpers
  get paginatedSubCoas(): any[] {
    let filtered = this.subCoas;
    if (this.typeFilter === 'parent') {
      filtered = filtered.filter(coa => coa.is_root);
    } else if (this.typeFilter !== 'all') {
      const targetCode = Number(this.typeFilter);
      const targetParent = this.rootParents.find(p => Number(p.account_code) === targetCode);
      if (targetParent) {
        filtered = filtered.filter(coa => coa.id === targetParent.id || coa.parent_id === targetParent.id);
      }
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    let filtered = this.subCoas;
    if (this.typeFilter === 'parent') {
      filtered = filtered.filter(coa => coa.is_root);
    } else if (this.typeFilter !== 'all') {
      const targetCode = Number(this.typeFilter);
      const targetParent = this.rootParents.find(p => Number(p.account_code) === targetCode);
      if (targetParent) {
        filtered = filtered.filter(coa => coa.id === targetParent.id || coa.parent_id === targetParent.id);
      }
    }
    return Math.ceil(filtered.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.loadAccounts();
  }

  onStatusFilter(status: 'all' | 'active' | 'inactive'): void {
    this.statusFilter = status;
    this.loadAccounts();
  }

  onTypeFilter(type: string): void {
    this.typeFilter = type;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  // Notes Modal methods
  openNotesModal(coa: ChartOfAccount): void {
    this.notesModalTitle = `Account Notes: ${coa.account_code} - ${coa.description}`;
    this.notesModalContent = coa.notes || '';
    this.showNotesModal = true;
  }

  closeNotesModal(): void {
    this.showNotesModal = false;
    this.notesModalTitle = '';
    this.notesModalContent = '';
  }

  // Form event handlers
  onParentChange(parentId: string): void {
    const parent = this.rootParents.find(p => p.id === parentId);
    if (parent) {
      this.accountForm.normal_balance = parent.normal_balance;
      
      const parentCode = Number(parent.account_code);
      // Suggest next code space
      if (parent.next_number && Number(parent.next_number) > parentCode) {
        this.accountForm.account_code = Number(parent.next_number);
      } else {
        this.accountForm.account_code = parentCode + 1;
      }
      this.onCodeChange(this.accountForm.account_code);

      // Prefill earningAccountCode with 310000 if parent is Revenue (410000) or Expense (510000)
      if (parentCode === 410000 || parentCode === 510000) {
        this.earningAccountCode = 310000;
      } else {
        this.earningAccountCode = null;
      }
    }
  }

  onCodeChange(code?: number): void {
    if (!this.isEditMode && code) {
      this.accountForm.next_number = code + 1;
    }
  }

  get isEarningAccountVisible(): boolean {
    if (!this.accountForm.parent_id) return false;
    const parent = this.rootParents.find(p => p.id === this.accountForm.parent_id);
    if (!parent) return false;
    const code = Number(parent.account_code);
    return code === 410000 || code === 510000;
  }

  setAccountType(isParent: boolean): void {
    this.accountForm.is_parent = isParent;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.isViewMode = false;
    this.modalTitle = 'Create Sub COA';
    this.accountForm = {
      account_code: undefined,
      key: '',
      description: '',
      parent_id: null,
      is_parent: false, // Default to false (Actual Account)
      normal_balance: 'debit',
      next_number: undefined,
      notes: '',
      is_active: true,
    };
    this.earningAccountCode = null;
    this.showModal = true;
  }

  openEditModal(coa: ChartOfAccount): void {
    this.isEditMode = true;
    this.isViewMode = false;
    this.modalTitle = `Edit Sub COA: ${coa.description}`;
    this.accountForm = { ...coa };
    if (coa.earning_account) {
      this.earningAccountCode = coa.earning_account.account_code;
    } else if (coa.earning_account_id) {
      const found = this.flatAccounts.find(a => a.id === coa.earning_account_id);
      this.earningAccountCode = found ? found.account_code : null;
    } else {
      this.earningAccountCode = null;
    }
    this.showModal = true;
  }

  openViewModal(coa: ChartOfAccount): void {
    this.isEditMode = false;
    this.isViewMode = true;
    this.modalTitle = `View Parent COA: ${coa.description}`;
    this.accountForm = { ...coa };
    this.earningAccountCode = null;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isViewMode = false;
    this.accountForm = {
      account_code: undefined,
      key: '',
      description: '',
      parent_id: null,
      is_parent: false,
      normal_balance: 'debit',
      next_number: undefined,
      notes: '',
      is_active: true,
    };
    this.earningAccountCode = null;
  }

  submitAccount(): void {
    if (this.isViewMode) return;
    if (!this.accountForm.account_code || !this.accountForm.description || !this.accountForm.parent_id) {
      this.toast.error('Parent COA, Account Code and Description are required');
      return;
    }

    // Resolve earning_account_id from earningAccountCode if visible
    if (this.isEarningAccountVisible) {
      if (this.earningAccountCode) {
        const found = this.flatAccounts.find(a => Number(a.account_code) === Number(this.earningAccountCode));
        if (!found) {
          this.toast.error(`Earning Account with code ${this.earningAccountCode} not found in Chart of Accounts`);
          return;
        }
        this.accountForm.earning_account_id = found.id;
      } else {
        this.accountForm.earning_account_id = null;
      }
    } else {
      this.accountForm.earning_account_id = null;
    }

    this.submitting = true;
    const body = { ...this.accountForm };
    if (!body.key) body.key = null;

    if (this.isEditMode) {
      const coaId = (this.accountForm as ChartOfAccount).id;
      this.service.updateAccount(coaId, body).subscribe({
        next: () => {
          this.toast.success('Sub COA updated successfully');
          this.closeModal();
          this.loadAccounts();
          this.submitting = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to update account');
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.service.createAccount(body).subscribe({
        next: () => {
          this.toast.success('Sub COA created successfully');
          this.closeModal();
          this.loadAccounts();
          this.submitting = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to create account');
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteAccount(coa: ChartOfAccount): void {
    this.confirmTitle = 'Delete Sub COA';
    this.confirmMessage = `Are you sure you want to delete Sub COA "${coa.account_code} - ${coa.description}"? This action cannot be undone.`;
    this.pendingAction = () => {
      this.service.deleteAccount(coa.id).subscribe({
        next: () => {
          this.toast.success('Sub COA deleted successfully');
          this.loadAccounts();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to delete account');
          this.cdr.markForCheck();
        }
      });
    };
    this.confirmOpen = true;
  }

  // Document management methods
  openDocModal(coa: ChartOfAccount): void {
    this.selectedAccount = coa;
    this.documents = [];
    this.showDocModal = true;
    this.loadDocuments(coa.id);
  }

  loadDocuments(coaId: string): void {
    this.service.getAccount(coaId).subscribe({
      next: (res) => {
        this.documents = res.documents || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load documents');
        this.cdr.markForCheck();
      }
    });
  }

  closeDocModal(): void {
    this.showDocModal = false;
    this.selectedAccount = null;
    this.documents = [];
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file || !this.selectedAccount) return;

    this.uploadingDoc = true;
    this.service.uploadDocument(this.selectedAccount.id, file).subscribe({
      next: () => {
        this.toast.success('Document uploaded successfully');
        this.loadDocuments(this.selectedAccount!.id);
        this.uploadingDoc = false;
        event.target.value = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to upload document');
        this.uploadingDoc = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadDoc(doc: ChartOfAccountDocument): void {
    window.open(`${environment.apiUrl}/chart-of-accounts/documents/download/${doc.file_url}`, '_blank');
  }

  deleteDoc(doc: ChartOfAccountDocument): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      this.service.deleteDocument(doc.id).subscribe({
        next: () => {
          this.toast.success('Document deleted successfully');
          if (this.selectedAccount) {
            this.loadDocuments(this.selectedAccount.id);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to delete document');
          this.cdr.markForCheck();
        }
      });
    };
    this.confirmOpen = true;
  }

  exportToExcel(): void {
    const headers = ['COA Type', 'Account Code', 'Description', 'Notes', 'Parent Code', 'Next Available Number', 'Normal Balance', 'Status'];
    const rows = this.subCoas.map(coa => [
      coa.is_root ? 'Root COA' : 'Sub COA',
      coa.account_code,
      coa.description,
      coa.notes || '',
      coa.is_root ? '-' : this.getParentCoaId(coa),
      coa.is_root ? (coa.next_number || '-') : '-',
      coa.normal_balance ? coa.normal_balance.toUpperCase() : '-',
      coa.is_active ? 'Active' : 'Inactive'
    ]);

    this.downloadCSV(headers, rows, 'chart_of_accounts.csv');
  }

  private downloadCSV(headers: string[], rows: any[][], filename: string): void {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(val => {
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
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

  onConfirm(): void {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }
}
