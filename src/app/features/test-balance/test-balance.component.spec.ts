import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { TestBalanceComponent } from './test-balance.component';
import { TestBalanceState } from './services/test-balance-state';

describe('TestBalanceComponent', () => {
  let component: TestBalanceComponent;
  let fixture: ComponentFixture<TestBalanceComponent>;
  let state: {
    data$: BehaviorSubject<unknown>;
    balanceSheet$: BehaviorSubject<unknown>;
    pl$: BehaviorSubject<unknown>;
    loading$: BehaviorSubject<boolean>;
    loadTestBalance: ReturnType<typeof vi.fn>;
    loadBalanceSheet: ReturnType<typeof vi.fn>;
    loadPLStatement: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    state = {
      data$: new BehaviorSubject(null),
      balanceSheet$: new BehaviorSubject(null),
      pl$: new BehaviorSubject(null),
      loading$: new BehaviorSubject(false),
      loadTestBalance: vi.fn(),
      loadBalanceSheet: vi.fn(),
      loadPLStatement: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TestBalanceComponent],
      providers: [{ provide: TestBalanceState, useValue: state }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the test-balance tab data on init', () => {
    expect(state.loadTestBalance).toHaveBeenCalledWith('June', 2026);
  });

  it('switching to the balance-sheet tab loads that report', () => {
    const period = `${component.month} ${component.year}`;
    component.selectTab('balance-sheet');
    expect(component.activeTab).toBe('balance-sheet');
    expect(state.loadBalanceSheet).toHaveBeenCalledWith(period);
  });

  it('switching to the pl tab loads that report', () => {
    const period = `${component.month} ${component.year}`;
    component.selectTab('pl');
    expect(state.loadPLStatement).toHaveBeenCalledWith(period);
  });

  it('formatCurrency formats negative values with a leading minus sign', () => {
    expect(component.formatCurrency(-1234.5)).toBe('-$1,234.50');
    expect(component.formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('getDifferenceSum sums matching row differences across accounts', () => {
    state.data$.next({
      month: 'June',
      year: 2026,
      status: 'ok',
      accounts: [
        { rows: [{ type: 'debit', difference: 10 }] },
        { rows: [{ type: 'debit', difference: 5 }] },
      ],
    });
    expect(component.getDifferenceSum('debit')).toBe(15);
  });
});
