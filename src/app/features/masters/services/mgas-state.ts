import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MgasApi } from './mgas-api';
import { MgaMaster } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class MgasState {
  private mgasApi = inject(MgasApi);

  mgas: MgaMaster[] = [];

  load(search?: string, active?: boolean): Observable<MgaMaster[]> {
    return this.mgasApi.getMgas(search, active).pipe(
      map(res => {
        this.mgas = res;
        return res;
      }),
    );
  }

  save(
    isEditMode: boolean,
    id: string | undefined,
    payload: Partial<MgaMaster>,
  ): Observable<MgaMaster> {
    return isEditMode && id ? this.mgasApi.updateMga(id, payload) : this.mgasApi.createMga(payload);
  }

  delete(id: string): Observable<void> {
    return this.mgasApi.deleteMga(id);
  }
}
