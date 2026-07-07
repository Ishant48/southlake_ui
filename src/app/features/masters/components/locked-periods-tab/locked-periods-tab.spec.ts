import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LockedPeriodsTab } from './locked-periods-tab';
import { environment } from '../../../../../environments/environment';

describe('LockedPeriodsTab', () => {
  let component: LockedPeriodsTab;
  let fixture: ComponentFixture<LockedPeriodsTab>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LockedPeriodsTab],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LockedPeriodsTab);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create and load locked periods on init', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`);
    req.flush([]);
    expect(component).toBeTruthy();
    expect(component.loading).toBe(false);
  });

  it('opens the lock-period modal with a blank period', () => {
    component.newPeriodToLock = '2026-01';
    component.openLockPeriodAdd();
    expect(component.showLockPeriodModal).toBe(true);
    expect(component.newPeriodToLock).toBe('');
  });

  it('locks a new period via submitLockPeriod and reloads the grid', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);

    component.submitLockPeriod('2026-02');

    const lockReq = httpMock.expectOne(`${environment.apiUrl}/masters/locked-periods/lock`);
    expect(lockReq.request.method).toBe('POST');
    expect(lockReq.request.body).toEqual({ period: '2026-02' });
    lockReq.flush({ period: '2026-02' });

    expect(component.showLockPeriodModal).toBe(false);
    expect(component.submitting).toBe(false);

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);
  });

  it('locks a period directly via togglePeriodLock with no confirmation step', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);

    component.togglePeriodLock('2026-03', true);

    const lockReq = httpMock.expectOne(`${environment.apiUrl}/masters/locked-periods/lock`);
    expect(lockReq.request.method).toBe('POST');
    lockReq.flush({ period: '2026-03' });

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);
  });

  it('unlocks a period directly via togglePeriodLock', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);

    component.togglePeriodLock('2026-03', false);

    const unlockReq = httpMock.expectOne(`${environment.apiUrl}/masters/locked-periods/unlock`);
    expect(unlockReq.request.method).toBe('POST');
    unlockReq.flush({ period: '2026-03' });

    httpMock.expectOne(r => r.url === `${environment.apiUrl}/masters/locked-periods`).flush([]);
  });
});
