import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { StatesState } from './states-state';

describe('StatesState', () => {
  let state: StatesState;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/states`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(StatesState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and caches states', () => {
    state.load('Texas', true).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    req.flush([{ id: 's-1', name: 'Texas', state_abbr: 'TX', state_code: 48 }]);

    expect(state.states).toEqual([{ id: 's-1', name: 'Texas', state_abbr: 'TX', state_code: 48 }]);
  });

  it('creates a state when not in edit mode', () => {
    const payload = {
      state_code: 48,
      state_abbr: 'TX',
      name: 'Texas',
      notes: null,
      is_active: true,
    };
    state.save(false, undefined, payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('updates a state when in edit mode with an id', () => {
    const payload = {
      state_code: 48,
      state_abbr: 'TX',
      name: 'Texas',
      notes: null,
      is_active: true,
    };
    state.save(true, 's-1', payload).subscribe();
    const req = httpMock.expectOne(`${base}/s-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a state', () => {
    state.delete('s-1').subscribe();
    const req = httpMock.expectOne(`${base}/s-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
