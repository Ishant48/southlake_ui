import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TreatiesApi } from './treaties-api';

describe('TreatiesApi', () => {
  let api: TreatiesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/treaties`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TreatiesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets treaties with search/isActive params', () => {
    api.getTreaties('Treaty A', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Treaty A');
    req.flush([]);
  });

  it('gets a single treaty', () => {
    api.getTreaty('t-1').subscribe();
    const req = httpMock.expectOne(`${base}/t-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('creates a treaty', () => {
    api.createTreaty({ treaty_code: 'TR-1' }).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a treaty', () => {
    api.updateTreaty('t-1', { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/t-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a treaty', () => {
    api.deleteTreaty('t-1').subscribe();
    const req = httpMock.expectOne(`${base}/t-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
