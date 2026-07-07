import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { LockedPeriodsApi } from './locked-periods-api';

describe('LockedPeriodsApi', () => {
  let api: LockedPeriodsApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/masters/locked-periods`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(LockedPeriodsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets locked periods with a search param', () => {
    api.getLockedPeriods('2026').subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('2026');
    req.flush([]);
  });

  it('locks and unlocks a period', () => {
    api.lockPeriod('June 2026').subscribe();
    let req = httpMock.expectOne(`${base}/lock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});

    api.unlockPeriod('June 2026').subscribe();
    req = httpMock.expectOne(`${base}/unlock`);
    expect(req.request.body).toEqual({ period: 'June 2026' });
    req.flush({});
  });
});
