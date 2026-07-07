import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatesApi } from './states-api';
import { StateMaster } from '../models/master.model';

export interface StatePayload {
  state_code: number;
  state_abbr: string;
  name: string;
  notes: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatesState {
  private statesApi = inject(StatesApi);

  states: StateMaster[] = [];

  load(search?: string, active?: boolean): Observable<StateMaster[]> {
    return this.statesApi.getStates(search, active).pipe(
      map(res => {
        this.states = res;
        return res;
      }),
    );
  }

  save(
    isEditMode: boolean,
    id: string | undefined,
    payload: StatePayload,
  ): Observable<StateMaster> {
    return isEditMode && id
      ? this.statesApi.updateState(id, payload)
      : this.statesApi.createState(payload);
  }

  delete(id: string): Observable<void> {
    return this.statesApi.deleteState(id);
  }
}
