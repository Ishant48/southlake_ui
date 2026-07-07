import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountFormModal, createBlankAccountForm } from './account-form-modal';
import { TreeAccount } from '../../models/chart-of-account.model';

describe('AccountFormModal', () => {
  let component: AccountFormModal;
  let fixture: ComponentFixture<AccountFormModal>;

  const revenueRoot: TreeAccount = {
    id: 'root-revenue',
    account_code: 410000,
    description: 'Revenue',
    is_parent: true,
    normal_balance: 'credit',
    next_number: 410001,
    is_active: true,
    is_root: true,
    treeDepth: 0,
  };

  const assetRoot: TreeAccount = {
    id: 'root-asset',
    account_code: 110000,
    description: 'Assets',
    is_parent: true,
    normal_balance: 'debit',
    is_active: true,
    is_root: true,
    treeDepth: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountFormModal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    component.open = false;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal-overlay')).toBeNull();
  });

  it('copies the model and earningAccountCode into local state on change', () => {
    const model = { ...createBlankAccountForm(), description: 'Cash' };
    component.model = model;
    component.earningAccountCode = 310000;
    component.ngOnChanges({
      model: {
        currentValue: model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
      earningAccountCode: {
        currentValue: 310000,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(model);
    expect(component.localEarningAccountCode).toBe(310000);
  });

  it('onParentChange derives normal_balance, account_code, and prefills the earning account for Revenue parents', () => {
    component.rootParents = [revenueRoot];
    component.formValue = createBlankAccountForm();
    component.isEditMode = false;

    component.onParentChange('root-revenue');

    expect(component.formValue.normal_balance).toBe('credit');
    expect(component.formValue.account_code).toBe(410001);
    expect(component.localEarningAccountCode).toBe(310000);
  });

  it('onParentChange clears the earning account for non-Revenue/Expense parents', () => {
    component.rootParents = [assetRoot];
    component.formValue = createBlankAccountForm();

    component.onParentChange('root-asset');

    expect(component.localEarningAccountCode).toBeNull();
  });

  it('onCodeChange bumps next_number only when adding (not editing)', () => {
    component.isEditMode = false;
    component.formValue = createBlankAccountForm();
    component.onCodeChange(500);
    expect(component.formValue.next_number).toBe(501);

    component.isEditMode = true;
    component.formValue.next_number = undefined;
    component.onCodeChange(500);
    expect(component.formValue.next_number).toBeUndefined();
  });

  it('isEarningAccountVisible reflects whether the resolved root is Revenue/Expense', () => {
    component.rootParents = [revenueRoot];
    component.formValue = { ...createBlankAccountForm(), parent_id: 'root-revenue' };
    expect(component.isEarningAccountVisible).toBe(true);

    component.rootParents = [assetRoot];
    component.formValue = { ...createBlankAccountForm(), parent_id: 'root-asset' };
    expect(component.isEarningAccountVisible).toBe(false);
  });

  it('setAccountType toggles is_parent', () => {
    component.formValue = createBlankAccountForm();
    component.setAccountType(true);
    expect(component.formValue.is_parent).toBe(true);
    component.setAccountType(false);
    expect(component.formValue.is_parent).toBe(false);
  });

  it('getParentCoaDisplay indents by tree depth', () => {
    expect(component.getParentCoaDisplay(revenueRoot)).toBe('410000 - Revenue');
    expect(component.getParentCoaDisplay(assetRoot)).toBe('    110000 - Assets');
  });

  it('emits save with the form value and earning account code', () => {
    component.formValue = { ...createBlankAccountForm(), description: 'Cash' };
    component.localEarningAccountCode = 310000;
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      form: component.formValue,
      earningAccountCode: 310000,
    });
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
