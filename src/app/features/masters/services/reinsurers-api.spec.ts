import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ReinsurersApi } from './reinsurers-api';

describe('ReinsurersApi', () => {
  let api: ReinsurersApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/reinsurers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ReinsurersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets reinsurers with search/isActive params', () => {
    api.getReinsurers('Star', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Star');
    req.flush([]);
  });

  it('creates, updates, and deletes a reinsurer', () => {
    api.createReinsurer({ name: 'Starlight Re' }).subscribe();
    let req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateReinsurer('r-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/r-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteReinsurer('r-1').subscribe();
    req = httpMock.expectOne(`${base}/r-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
