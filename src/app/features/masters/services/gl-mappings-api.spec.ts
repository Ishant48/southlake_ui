import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { GlMappingsApi } from './gl-mappings-api';

describe('GlMappingsApi', () => {
  let api: GlMappingsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/gl-mappings`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(GlMappingsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all mappings', () => {
    api.getMappings().subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets a single mapping by id', () => {
    api.getMapping('m-1').subscribe();
    const req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('creates a mapping', () => {
    const payload = { coa_id: 'coa-1', type: 'AR' };
    api.createMapping(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates a mapping', () => {
    api.updateMapping('m-1', { type: 'AP' }).subscribe();
    const req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a mapping', () => {
    api.deleteMapping('m-1').subscribe();
    const req = httpMock.expectOne(`${base}/m-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
