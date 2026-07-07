import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ChartOfAccountsApi } from './chart-of-accounts-api';

describe('ChartOfAccountsApi', () => {
  let api: ChartOfAccountsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/chart-of-accounts`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ChartOfAccountsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets accounts with optional search/isActive params', () => {
    api.getAccounts('cash', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('cash');
    expect(req.request.params.get('is_active')).toBe('true');
    req.flush([]);
  });

  it('gets a single account by id', () => {
    api.getAccount('coa-1').subscribe();
    const req = httpMock.expectOne(`${base}/coa-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ documents: [] });
  });

  it('creates an account', () => {
    const payload = { description: 'Cash' };
    api.createAccount(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates an account', () => {
    api.updateAccount('coa-1', { description: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/coa-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes an account', () => {
    api.deleteAccount('coa-1').subscribe();
    const req = httpMock.expectOne(`${base}/coa-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploads a document as form data', () => {
    const file = new File(['content'], 'doc.pdf');
    api.uploadDocument('coa-1', file).subscribe();
    const req = httpMock.expectOne(`${base}/coa-1/documents`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({});
  });

  it('deletes a document', () => {
    api.deleteDocument('doc-1').subscribe();
    const req = httpMock.expectOne(`${base}/documents/doc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
