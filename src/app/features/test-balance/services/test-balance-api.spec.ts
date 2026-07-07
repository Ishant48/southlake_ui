import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TestBalanceApi } from './test-balance-api';

describe('TestBalanceApi', () => {
  let api: TestBalanceApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TestBalanceApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests test balance with month/year query params', () => {
    api.getTestBalance('June', 2026).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/test-balance` && r.method === 'GET',
    );
    expect(req.request.params.get('month')).toBe('June');
    expect(req.request.params.get('year')).toBe('2026');
    req.flush({ month: 'June', year: 2026, status: 'ok', accounts: [] });
  });

  it('requests balance sheet for a period', () => {
    api.getBalanceSheet('June 2026').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${environment.apiUrl}/financial-reports/balance-sheet`,
    );
    expect(req.request.params.get('period')).toBe('June 2026');
    req.flush({
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
    });
  });

  it('requests P&L statement for a period', () => {
    api.getPLStatement('June 2026').subscribe();

    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/financial-reports/pl`);
    expect(req.request.params.get('period')).toBe('June 2026');
    req.flush({ revenues: [], expenses: [], totalRevenue: 0, totalExpense: 0, netIncome: 0 });
  });
});
