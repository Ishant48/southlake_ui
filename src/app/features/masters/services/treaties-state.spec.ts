import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TreatiesState } from './treaties-state';

describe('TreatiesState', () => {
  let state: TreatiesState;
  let httpMock: HttpTestingController;
  const treatiesBase = `${environment.apiUrl}/masters/treaties`;
  const workbooksBase = `${environment.apiUrl}/workbooks`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(TreatiesState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads workbooks, tracks ITD seeding/status, then loads treaties', () => {
    state.load('Acme', true).subscribe();

    const wbReq = httpMock.expectOne(r => r.url === workbooksBase);
    wbReq.flush([
      { id: 1, program: 'Acme Treaty', source: 'ITD', status: 'Approved' },
      { id: 2, program: 'Other Treaty', source: 'Monthly', status: 'Pending' },
    ]);

    const treatiesReq = httpMock.expectOne(r => r.url === treatiesBase);
    treatiesReq.flush([{ id: 't-1', name: 'Acme Treaty' }]);

    expect(state.treaties).toEqual([{ id: 't-1', name: 'Acme Treaty' }]);
    expect(state.hasITDSeeded('Acme Treaty')).toBe(true);
    expect(state.itdWorkbookIds.get('Acme Treaty')).toBe(1);
    expect(state.getTreatyStatus('Acme Treaty')).toBe('Approved');
    expect(state.getTreatyStatus('Other Treaty')).toBe('Pending');
    expect(state.getTreatyStatus(undefined)).toBe('Draft');
    expect(state.getTreatyStatus('Unknown Treaty')).toBe('Pending');
  });

  it('creates a treaty when not in edit mode', () => {
    state.save(false, undefined, { treaty_code: 'TR-1', name: 'Test' }).subscribe();
    const req = httpMock.expectOne(treatiesBase);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a treaty when in edit mode with an id', () => {
    state.save(true, 't-1', { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${treatiesBase}/t-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a treaty', () => {
    state.delete('t-1').subscribe();
    const req = httpMock.expectOne(`${treatiesBase}/t-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
