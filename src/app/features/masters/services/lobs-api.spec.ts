import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { LobsApi } from './lobs-api';

describe('LobsApi', () => {
  let api: LobsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/lobs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LobsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets, creates, updates, and deletes an LOB', () => {
    api.getLobs('Auto', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Auto');
    req.flush([]);

    api.createLob({ lob_code: 'AUTO', name: 'Auto' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateLob('l-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/l-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteLob('l-1').subscribe();
    req = httpMock.expectOne(`${base}/l-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
