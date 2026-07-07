import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartOfAccount } from '../../../../core/models/chart-of-account.model';
import { TreeAccount } from '../../models/chart-of-account.model';

export interface AccountFormSaveEvent {
  form: Partial<ChartOfAccount>;
  earningAccountCode: number | null;
}

export function createBlankAccountForm(): Partial<ChartOfAccount> {
  return {
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
}

@Component({
  selector: 'app-account-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './account-form-modal.html',
  styleUrl: './account-form-modal.scss',
})
export class AccountFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: Partial<ChartOfAccount> = createBlankAccountForm();
  @Input() isEditMode = false;
  @Input() isViewMode = false;
  @Input() submitting = false;
  @Input() rootParents: TreeAccount[] = [];
  @Input() earningAccountCode: number | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<AccountFormSaveEvent>();

  formValue: Partial<ChartOfAccount> = createBlankAccountForm();
  localEarningAccountCode: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model };
    }
    if (changes['earningAccountCode']) {
      this.localEarningAccountCode = this.earningAccountCode;
    }
  }

  onParentChange(parentId: string): void {
    const parent = this.rootParents.find(p => p.id === parentId);
    if (parent) {
      this.formValue.normal_balance = parent.normal_balance;

      const parentCode = Number(parent.account_code);
      if (parent.next_number && Number(parent.next_number) > parentCode) {
        this.formValue.account_code = Number(parent.next_number);
      } else {
        this.formValue.account_code = parentCode + 1;
      }
      this.onCodeChange(this.formValue.account_code);

      let currentParent = parent;
      let parentCodeStr = String(currentParent.account_code);
      while (
        currentParent &&
        !parentCodeStr.startsWith('41') &&
        !parentCodeStr.startsWith('51') &&
        currentParent.parent_id
      ) {
        const nextParent = this.rootParents.find(p => p.id === currentParent.parent_id);
        if (!nextParent || nextParent.id === currentParent.id) break;
        currentParent = nextParent;
        parentCodeStr = String(currentParent.account_code);
      }

      if (parentCodeStr.startsWith('41') || parentCodeStr.startsWith('51')) {
        this.localEarningAccountCode = 310000;
      } else {
        this.localEarningAccountCode = null;
      }
    }
  }

  onCodeChange(code?: number): void {
    if (!this.isEditMode && code) {
      this.formValue.next_number = code + 1;
    }
  }

  get isEarningAccountVisible(): boolean {
    if (!this.formValue.parent_id) return false;
    const parent = this.rootParents.find(p => p.id === this.formValue.parent_id);
    if (!parent) return false;

    let currentParent = parent;
    let parentCodeStr = String(currentParent.account_code);
    while (
      currentParent &&
      !parentCodeStr.startsWith('41') &&
      !parentCodeStr.startsWith('51') &&
      currentParent.parent_id
    ) {
      const nextParent = this.rootParents.find(p => p.id === currentParent.parent_id);
      if (!nextParent || nextParent.id === currentParent.id) break;
      currentParent = nextParent;
      parentCodeStr = String(currentParent.account_code);
    }

    return parentCodeStr.startsWith('41') || parentCodeStr.startsWith('51');
  }

  setAccountType(isParent: boolean): void {
    this.formValue.is_parent = isParent;
  }

  getParentCoaDisplay(root: TreeAccount): string {
    const depth = root.treeDepth ?? 0;
    const indent = '    '.repeat(depth);
    const code = Number(root.account_code);
    return `${indent}${code} - ${root.description ?? ''}`;
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit({ form: this.formValue, earningAccountCode: this.localEarningAccountCode });
  }
}
