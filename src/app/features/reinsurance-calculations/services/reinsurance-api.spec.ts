import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ReinsuranceApi } from './reinsurance-api';

describe('ReinsuranceApi', () => {
  let api: ReinsuranceApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/api`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ReinsuranceApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets workbooks', () => {
    api.getWorkbooks().subscribe();
    const req = httpMock.expectOne(`${base}/workbooks`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets a single workbook', () => {
    api.getWorkbook(1).subscribe();
    const req = httpMock.expectOne(`${base}/workbooks/1`);
    req.flush({});
  });

  it('uploads a workbook as form data with overwrite/program flags', () => {
    const file = new File(['data'], 'wb.xlsx');
    api.uploadWorkbook(file, true, 'Program A').subscribe();
    const req = httpMock.expectOne(`${base}/workbooks/upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ workbook: {} });
  });

  it('updates an exhibit', () => {
    api.updateExhibit(1, 'CA', { uep: 100 }).subscribe();
    const req = httpMock.expectOne(`${base}/workbooks/1/exhibits/CA`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('gets the reinsurance statement for a state', () => {
    api.getReinsuranceStatement(1, 'CA').subscribe();
    const req = httpMock.expectOne(`${base}/workbooks/1/reinsurance-statement/CA`);
    req.flush([]);
  });

  it('gets cash settlement calculations with a default stateCode', () => {
    api.getCashSettlementCalculations(1).subscribe();
    const req = httpMock.expectOne(
      `${base}/workbooks/1/cash-settlement-calculations?stateCode=TOTAL`,
    );
    req.flush({});
  });

  it('creates a manual ITD baseline', () => {
    const payload = { program: 'Treaty A' };
    api.createManualITD(payload).subscribe();
    const req = httpMock.expectOne(`${base}/workbooks/manual-itd`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });
});
