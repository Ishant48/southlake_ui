import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { StatesApi } from './states-api';

describe('StatesApi', () => {
  let api: StatesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/states`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(StatesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets states with search/isActive params', () => {
    api.getStates('CA', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('CA');
    expect(req.request.params.get('is_active')).toBe('true');
    req.flush([]);
  });

  it('creates a state', () => {
    const payload = { state_abbr: 'CA', name: 'California' };
    api.createState(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates a state', () => {
    api.updateState('s-1', { name: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/s-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a state', () => {
    api.deleteState('s-1').subscribe();
    const req = httpMock.expectOne(`${base}/s-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('uploads and deletes a state document', () => {
    api.uploadStateDocument('s-1', new File([], 'f.pdf'), 'W9').subscribe();
    let req = httpMock.expectOne(`${base}/s-1/documents`);
    expect(req.request.method).toBe('POST');
    req.flush({});

    api.deleteStateDocument('doc-1').subscribe();
    req = httpMock.expectOne(`${base}/documents/doc-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
