import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { RiskCompaniesApi } from './risk-companies-api';

describe('RiskCompaniesApi', () => {
  let api: RiskCompaniesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/risk-companies`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RiskCompaniesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets and creates a risk company', () => {
    api.getRiskCompanies('Acme', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Acme');
    req.flush([]);

    api.createRiskCompany({ name: 'Acme Risk' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates and deletes a risk company', () => {
    api.updateRiskCompany('rc-1', { name: 'Updated' }).subscribe();
    let req = httpMock.expectOne(`${base}/rc-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteRiskCompany('rc-1').subscribe();
    req = httpMock.expectOne(`${base}/rc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploads and deletes a risk company document', () => {
    api.uploadRiskCompanyDocument('rc-1', new File([], 'f.pdf'), 'W9').subscribe();
    let req = httpMock.expectOne(`${base}/rc-1/documents`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.deleteRiskCompanyDocument('doc-1').subscribe();
    req = httpMock.expectOne(`${base}/documents/doc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
