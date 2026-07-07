import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { MgasApi } from './mgas-api';

describe('MgasApi', () => {
  let api: MgasApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/mgas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MgasApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates an MGA', () => {
    const payload = { mga_code: 'M1', name: 'MGA One' };
    api.createMga(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates and deletes an MGA', () => {
    api.updateMga('m-1', { name: 'Updated' }).subscribe();
    let req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteMga('m-1').subscribe();
    req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploads and deletes an MGA document', () => {
    api.uploadMgaDocument('m-1', new File([], 'f.pdf'), 'W9').subscribe();
    let req = httpMock.expectOne(`${base}/m-1/documents`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.deleteMgaDocument('doc-1').subscribe();
    req = httpMock.expectOne(`${base}/documents/doc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('adds an MGA to treaties', () => {
    api.addMgaToTreaties('m-1', ['t-1', 't-2']).subscribe();
    const req = httpMock.expectOne(`${base}/m-1/add-to-treaties`);
    expect(req.request.body).toEqual({ treaty_ids: ['t-1', 't-2'] });
    req.flush({});
  });
});
