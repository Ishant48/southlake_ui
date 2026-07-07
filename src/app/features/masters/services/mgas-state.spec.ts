import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { MgasState } from './mgas-state';

describe('MgasState', () => {
  let state: MgasState;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/mgas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(MgasState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and caches MGAs', () => {
    state.load('Acme', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    req.flush([{ id: 'm-1', name: 'Acme MGA', mga_code: 'ACME' }]);

    expect(state.mgas).toEqual([{ id: 'm-1', name: 'Acme MGA', mga_code: 'ACME' }]);
  });

  it('creates an MGA when not in edit mode', () => {
    state.save(false, undefined, { mga_code: 'ACME', name: 'Acme MGA' }).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates an MGA when in edit mode with an id', () => {
    state.save(true, 'm-1', { name: 'Acme Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes an MGA', () => {
    state.delete('m-1').subscribe();
    const req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
