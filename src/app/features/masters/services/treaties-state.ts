import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TreatiesApi, TreatyPayload } from './treaties-api';
import { ReinsuranceApi } from '../../reinsurance-calculations/services/reinsurance-api';
import { Treaty } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class TreatiesState {
  private treatiesApi = inject(TreatiesApi);
  private reinsuranceApi = inject(ReinsuranceApi);

  treaties: Treaty[] = [];
  seededProgramITD = new Set<string>();
  itdWorkbookIds = new Map<string, number>();
  treatyWorkbookStatuses = new Map<string, string>();

  load(search?: string, active?: boolean): Observable<Treaty[]> {
    return this.reinsuranceApi.getWorkbooks().pipe(
      switchMap(workbooks => {
        this.seededProgramITD.clear();
        this.itdWorkbookIds.clear();
        this.treatyWorkbookStatuses.clear();
        workbooks.forEach(wb => {
          if (wb.source === 'ITD' && wb.program) {
            this.seededProgramITD.add(wb.program);
            this.itdWorkbookIds.set(wb.program, wb.id);
          }
          const progName = (wb.program ?? '').trim();
          const existing = this.treatyWorkbookStatuses.get(progName);
          if (existing !== 'Approved') {
            this.treatyWorkbookStatuses.set(progName, (wb.status as string) || 'Pending');
          }
        });
        return this.treatiesApi.getTreaties(search, active);
      }),
      map(res => {
        this.treaties = res;
        return res;
      }),
    );
  }

  save(isEditMode: boolean, id: string | undefined, payload: TreatyPayload): Observable<Treaty> {
    return isEditMode && id
      ? this.treatiesApi.updateTreaty(id, payload)
      : this.treatiesApi.createTreaty(payload);
  }

  delete(id: string): Observable<void> {
    return this.treatiesApi.deleteTreaty(id);
  }

  hasITDSeeded(programName: string): boolean {
    return this.seededProgramITD.has((programName || '').trim());
  }

  getTreatyStatus(programName?: string): string {
    if (!programName) return 'Draft';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
    return this.treatyWorkbookStatuses.get(programName) || 'Pending';
  }
}
