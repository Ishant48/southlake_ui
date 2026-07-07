import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { CobsApi } from './cobs-api';

describe('CobsApi', () => {
  let api: CobsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/cobs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CobsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets, creates, updates, and deletes a COB', () => {
    api.getCobs('Phys', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Phys');
    req.flush([]);

    api.createCob({ cob_code: 'PHYS', name: 'Physical Damage' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateCob('c-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/c-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteCob('c-1').subscribe();
    req = httpMock.expectOne(`${base}/c-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
