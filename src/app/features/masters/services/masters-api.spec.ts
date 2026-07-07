import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { MastersApi } from './masters-api';

describe('MastersApi', () => {
  let api: MastersApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MastersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets states with search/isActive params', () => {
    api.getStates('CA', true).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/states`);
    expect(req.request.params.get('search')).toBe('CA');
    expect(req.request.params.get('is_active')).toBe('true');
    req.flush([]);
  });

  it('creates an MGA', () => {
    const payload = { mga_code: 'M1', name: 'MGA One' };
    api.createMga(payload).subscribe();
    const req = httpMock.expectOne(`${base}/mgas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('gets treaties with search/isActive params', () => {
    api.getTreaties('Treaty A', true).subscribe();
    const req = httpMock.expectOne(r => r.url === `${base}/treaties`);
    expect(req.request.params.get('search')).toBe('Treaty A');
    req.flush([]);
  });

  it('updates a treaty', () => {
    api.updateTreaty('t-1', { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/treaties/t-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('adds an MGA to treaties', () => {
    api.addMgaToTreaties('mga-1', ['t-1', 't-2']).subscribe();
    const req = httpMock.expectOne(`${base}/mgas/mga-1/add-to-treaties`);
    expect(req.request.body).toEqual({ treaty_ids: ['t-1', 't-2'] });
    req.flush({});
  });

  it('locks and unlocks a period', () => {
    api.lockPeriod('June 2026').subscribe();
    let req = httpMock.expectOne(`${base}/locked-periods/lock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});

    api.unlockPeriod('June 2026').subscribe();
    req = httpMock.expectOne(`${base}/locked-periods/unlock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});
  });

  it('deletes a document type', () => {
    api.deleteDocumentType('dt-1').subscribe();
    const req = httpMock.expectOne(`${base}/document-types/dt-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('creates a sequence prefix counter', () => {
    const payload = { code: 'SEQ1' };
    api.createSequencePrefixCounter(payload).subscribe();
    const req = httpMock.expectOne(`${base}/sequence-prefix-counters`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
