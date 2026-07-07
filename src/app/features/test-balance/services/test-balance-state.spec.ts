import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TestBalanceState } from './test-balance-state';
import { TestBalanceApi } from './test-balance-api';
import { TestBalanceResponse } from '../models/test-balance.model';

type MockTestBalanceApi = {
  [K in keyof TestBalanceApi]: ReturnType<typeof vi.fn>;
};

describe('TestBalanceState', () => {
  let state: TestBalanceState;
  let api: MockTestBalanceApi;

  const response: TestBalanceResponse = { month: 'June', year: 2026, status: 'ok', accounts: [] };

  beforeEach(() => {
    api = {
      getTestBalance: vi.fn(),
      getBalanceSheet: vi.fn(),
      getPLStatement: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [TestBalanceState, { provide: TestBalanceApi, useValue: api }],
    });
    state = TestBed.inject(TestBalanceState);
  });

  it('loads test balance data and updates data$/loading$', () => {
    api.getTestBalance.mockReturnValue(of(response));

    const loading: boolean[] = [];
    state.loading$.subscribe(v => loading.push(v));

    state.loadTestBalance('June', 2026);

    expect(state.data).toEqual(response);
    expect(loading[loading.length - 1]).toBe(false);
  });

  it('sets error$ and clears loading$ when the request fails', () => {
    api.getTestBalance.mockReturnValue(throwError(() => new Error('network error')));

    let error: string | null = null;
    state.error$.subscribe(v => (error = v));

    state.loadTestBalance('June', 2026);

    expect(error).toBe('Error loading test balance');
  });

  it('loads balance sheet data', () => {
    const bs = {
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    };
    api.getBalanceSheet.mockReturnValue(of(bs));

    let result: unknown = null;
    state.balanceSheet$.subscribe(v => (result = v));
    state.loadBalanceSheet('June 2026');

    expect(result).toEqual(bs);
  });

  it('loads P&L statement data', () => {
    const pl = { revenues: [], expenses: [], totalRevenue: 0, totalExpense: 0, netIncome: 0 };
    api.getPLStatement.mockReturnValue(of(pl));

    let result: unknown = null;
    state.pl$.subscribe(v => (result = v));
    state.loadPLStatement('June 2026');

    expect(result).toEqual(pl);
  });
});
