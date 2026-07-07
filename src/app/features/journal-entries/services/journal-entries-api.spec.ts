import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { JournalEntriesApi } from './journal-entries-api';

describe('JournalEntriesApi', () => {
  let api: JournalEntriesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/journal-batches`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(JournalEntriesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets batches with optional period/agent/search params', () => {
    api.getBatches('June 2026', 'Agent', 'term').subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('period')).toBe('June 2026');
    expect(req.request.params.get('agent')).toBe('Agent');
    expect(req.request.params.get('search')).toBe('term');
    req.flush([]);
  });

  it('gets a single batch by id', () => {
    api.getBatch('b-1').subscribe();
    const req = httpMock.expectOne(`${base}/b-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('creates a batch', () => {
    const payload = { period: 'June 2026', agent_name: 'Agent' };
    api.createBatch(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates a batch', () => {
    api.updateBatch('b-1', { period: 'July 2026' }).subscribe();
    const req = httpMock.expectOne(`${base}/b-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a batch', () => {
    api.deleteBatch('b-1').subscribe();
    const req = httpMock.expectOne(`${base}/b-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('gets batch entries', () => {
    api.getBatchEntries('b-1').subscribe();
    const req = httpMock.expectOne(`${base}/b-1/entries`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('posts entries for a batch', () => {
    const payload = {
      je_number: 1,
      lines: [{ description: 'Line', coa_id: 'coa-1', date: '2026-06-01' }],
    };
    api.postEntries('b-1', payload).subscribe();
    const req = httpMock.expectOne(`${base}/b-1/entries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush([]);
  });
});
