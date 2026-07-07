import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { BrokersApi } from './brokers-api';

describe('BrokersApi', () => {
  let api: BrokersApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/brokers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(BrokersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets, creates, updates, and deletes a broker', () => {
    api.getBrokers('Acme', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Acme');
    req.flush([]);

    api.createBroker({ name: 'Acme Brokers' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateBroker('b-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/b-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteBroker('b-1').subscribe();
    req = httpMock.expectOne(`${base}/b-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
