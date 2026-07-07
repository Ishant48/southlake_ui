import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { RiskCompaniesState } from './risk-companies-state';

describe('RiskCompaniesState', () => {
  let state: RiskCompaniesState;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/risk-companies`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(RiskCompaniesState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const payload = {
    risk_company_id: 'RC-1',
    company_id: 1,
    id_name: null,
    name: 'Acme Risk',
    phone: null,
    is_admitted: true,
    state: null,
    address: null,
    zip: null,
    city: null,
    notes: null,
    is_active: true,
  };

  it('loads and caches risk companies', () => {
    state.load('Acme', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    req.flush([{ id: 'rc-1', name: 'Acme Risk' }]);

    expect(state.riskCompanies).toEqual([{ id: 'rc-1', name: 'Acme Risk' }]);
  });

  it('creates a risk company when not in edit mode', () => {
    state.save(false, undefined, payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a risk company when in edit mode with an id', () => {
    state.save(true, 'rc-1', payload).subscribe();
    const req = httpMock.expectOne(`${base}/rc-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a risk company', () => {
    state.delete('rc-1').subscribe();
    const req = httpMock.expectOne(`${base}/rc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
