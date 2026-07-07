import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { DocumentTypesApi } from './document-types-api';

describe('DocumentTypesApi', () => {
  let api: DocumentTypesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/document-types`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DocumentTypesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets, creates, and updates a document type', () => {
    api.getDocumentTypes('W9', true).subscribe();
    let req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('W9');
    req.flush([]);

    api.createDocumentType({ code: 'W9', name: 'W-9 Form' }).subscribe();
    req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.updateDocumentType('dt-1', { name: 'Updated' }).subscribe();
    req = httpMock.expectOne(`${base}/dt-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a document type', () => {
    api.deleteDocumentType('dt-1').subscribe();
    const req = httpMock.expectOne(`${base}/dt-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
