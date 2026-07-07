import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LockedPeriodsApi } from './locked-periods-api';
import { SimpleMasterRecord } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class LockedPeriodsState {
  private lockedPeriodsApi = inject(LockedPeriodsApi);

  lockedPeriods: SimpleMasterRecord[] = [];

  load(search?: string): Observable<SimpleMasterRecord[]> {
    return this.lockedPeriodsApi.getLockedPeriods(search).pipe(
      map(res => {
        this.lockedPeriods = res;
        return res;
      }),
    );
  }

  lock(period: string): Observable<SimpleMasterRecord> {
    return this.lockedPeriodsApi.lockPeriod(period);
  }

  unlock(period: string): Observable<SimpleMasterRecord> {
    return this.lockedPeriodsApi.unlockPeriod(period);
  }
}
