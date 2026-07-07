import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { SequencePrefixCountersApi } from './sequence-prefix-counters-api';

describe('SequencePrefixCountersApi', () => {
  let api: SequencePrefixCountersApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/sequence-prefix-counters`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(SequencePrefixCountersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets sequence prefix counters with search/isActive params', () => {
    api.getSequencePrefixCounters('SEQ', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('SEQ');
    req.flush([]);
  });

  it('creates a sequence prefix counter', () => {
    const payload = { code: 'SEQ1' };
    api.createSequencePrefixCounter(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates and deletes a sequence prefix counter', () => {
    api.updateSequencePrefixCounter('sp-1', { code: 'SEQ2' }).subscribe();
    let req = httpMock.expectOne(`${base}/sp-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteSequencePrefixCounter('sp-1').subscribe();
    req = httpMock.expectOne(`${base}/sp-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
