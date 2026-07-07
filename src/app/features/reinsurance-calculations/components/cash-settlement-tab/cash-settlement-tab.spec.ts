import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashSettlementTab, CashSettlement } from './cash-settlement-tab';

describe('CashSettlementTab', () => {
  let component: CashSettlementTab;
  let fixture: ComponentFixture<CashSettlementTab>;

  const sample: CashSettlement = {
    beg_bal: 1000,
    amt_paid: 250,
    qsPct: 80,
    reinsurerName: 'Starlight Re',
    rows: [{ label: 'Beginning Balance', isInput: 'beg_bal' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashSettlementTab],
    }).compileComponents();

    fixture = TestBed.createComponent(CashSettlementTab);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('copies the cashSettlement input into local formValue on change', () => {
    component.cashSettlement = sample;
    component.ngOnChanges({
      cashSettlement: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(sample);
    expect(component.formValue).not.toBe(sample);
  });

  it('formatAccounting parenthesizes negatives and dashes near-zero values', () => {
    expect(component.formatAccounting(1234.5)).toBe('1,234.50');
    expect(component.formatAccounting(-500)).toBe('(500.00)');
    expect(component.formatAccounting(0.0001)).toBe('-');
    expect(component.formatAccounting(null)).toBe('-');
  });

  it('emits save with numeric beg_bal/amt_paid from the current form value', () => {
    component.formValue = { beg_bal: '100' as unknown as number, amt_paid: 50 };
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submitSave();

    expect(saveSpy).toHaveBeenCalledWith({ beg_bal: 100, amt_paid: 50 });
  });

  it('renders rows and the Update Balances button triggers submitSave', () => {
    component.cashSettlement = sample;
    component.ngOnChanges({
      cashSettlement: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    fixture.detectChanges();

    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);
    const updateBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-primary',
    ) as HTMLButtonElement;
    updateBtn.click();

    expect(saveSpy).toHaveBeenCalledWith({ beg_bal: 1000, amt_paid: 250 });
  });
});
