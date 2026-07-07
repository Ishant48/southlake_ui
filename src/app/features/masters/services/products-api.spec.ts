import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ProductsApi } from './products-api';

describe('ProductsApi', () => {
  let api: ProductsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/products`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ProductsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets, creates, updates, and deletes a product', () => {
    api.getProducts('Auto', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('Auto');
    req.flush([]);

    api.createProduct({ name: 'Auto Policy' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateProduct('p-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/p-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});

    api.deleteProduct('p-1').subscribe();
    req = httpMock.expectOne(`${base}/p-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
