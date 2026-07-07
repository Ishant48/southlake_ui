import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { DocumentsDrawerState } from './documents-drawer-state';
import { DocumentMode } from '../models/master-tab.model';

describe('DocumentsDrawerState', () => {
  let state: DocumentsDrawerState;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(DocumentsDrawerState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and caches document type options', () => {
    state.loadDocumentTypes().subscribe();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/document-types`);
    req.flush([{ id: 'dt-1', code: 'W9', name: 'W-9' }]);

    expect(state.documentTypesOptions).toEqual([{ id: 'dt-1', code: 'W9', name: 'W-9' }]);
  });

  it('loads documents for an MGA and caches the list', () => {
    state.loadDocuments(DocumentMode.Mga, 'mga-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/mgas/mga-1`);
    req.flush({ id: 'mga-1', documents: [{ id: 'd-1', file_name: 'x.pdf' }] });

    expect(state.documentsList).toEqual([{ id: 'd-1', file_name: 'x.pdf' }]);
  });

  it('falls back to an empty list when the response has no documents', () => {
    state.loadDocuments(DocumentMode.State, 'state-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/states/state-1`);
    req.flush({ id: 'state-1' });

    expect(state.documentsList).toEqual([]);
  });

  it('uploads a document to the correct endpoint per mode', () => {
    const file = new File(['x'], 'x.pdf');
    state.upload(DocumentMode.RiskCompany, 'rc-1', file, 'W9').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/risk-companies/rc-1/documents`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('deletes a document from the correct endpoint per mode', () => {
    state.delete(DocumentMode.Mga, 'd-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/masters/mgas/documents/d-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('returns the correct download endpoint segment per mode', () => {
    expect(state.getDownloadEndpoint(DocumentMode.Mga)).toBe('mgas');
    expect(state.getDownloadEndpoint(DocumentMode.State)).toBe('states');
    expect(state.getDownloadEndpoint(DocumentMode.RiskCompany)).toBe('risk-companies');
  });
});
