import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { LockedPeriodsState } from './locked-periods-state';

describe('LockedPeriodsState', () => {
  let state: LockedPeriodsState;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/locked-periods`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    state = TestBed.inject(LockedPeriodsState);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and caches locked periods', () => {
    state.load('2026').subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    req.flush([{ id: 'p-1', name: 'June 2026' }]);

    expect(state.lockedPeriods).toEqual([{ id: 'p-1', name: 'June 2026' }]);
  });

  it('locks a period', () => {
    state.lock('June 2026').subscribe();
    const req = httpMock.expectOne(`${base}/lock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});
  });

  it('unlocks a period', () => {
    state.unlock('June 2026').subscribe();
    const req = httpMock.expectOne(`${base}/unlock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});
  });
});
