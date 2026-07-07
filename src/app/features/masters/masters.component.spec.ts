import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MastersComponent } from './masters.component';
import { MasterTab } from './models/master-tab.model';

describe('MastersComponent routing', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;

  function flushAllPending(): void {
    for (let i = 0; i < 10; i++) {
      const pending = httpMock.match(() => true);
      if (pending.length === 0) return;
      pending.forEach(req => req.flush([]));
    }
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'masters', component: MastersComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    harness = await RouterTestingHarness.create();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('defaults to the Treaties tab when no tab query param is present', async () => {
    const component = await harness.navigateByUrl('/masters', MastersComponent);
    flushAllPending();
    expect(component.currentTab).toBe(MasterTab.Treaties);
  });

  it('switches currentTab when navigating with a different tab query param on the same route', async () => {
    const component = await harness.navigateByUrl('/masters?tab=mgas', MastersComponent);
    flushAllPending();
    expect(component.currentTab).toBe(MasterTab.Mgas);

    await harness.navigateByUrl('/masters?tab=lobs', MastersComponent);
    flushAllPending();
    expect(component.currentTab).toBe(MasterTab.Lobs);
  });

  it('switches currentTab across every tab value in sequence, simulating repeated sidebar clicks', async () => {
    const component = await harness.navigateByUrl('/masters?tab=treaties', MastersComponent);
    flushAllPending();

    for (const tab of Object.values(MasterTab)) {
      await harness.navigateByUrl(`/masters?tab=${tab}`, MastersComponent);
      flushAllPending();
      expect(component.currentTab).toBe(tab);
    }
  });
});
