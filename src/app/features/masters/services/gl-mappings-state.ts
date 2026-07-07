import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GlMappingsApi } from './gl-mappings-api';
import { ChartOfAccountsApi } from '../../chart-of-accounts/services/chart-of-accounts-api';
import { GlMapping } from '../models/gl-mapping.model';
import { ChartOfAccount } from '../../../core/models/chart-of-account.model';

export interface GlMappingPayload {
  coa_id: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class GlMappingsState {
  private glMappingsApi = inject(GlMappingsApi);
  private coaApi = inject(ChartOfAccountsApi);

  glMappings: GlMapping[] = [];
  coaOptions: ChartOfAccount[] = [];

  load(searchTerm?: string): Observable<GlMapping[]> {
    return this.glMappingsApi.getMappings().pipe(
      map(data => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        const term = (searchTerm || '').toLowerCase();
        this.glMappings = term
          ? data.filter(m => {
              const typeMatch = m.type.toLowerCase().includes(term);
              const code = m.coa?.account_code?.toString() ?? '';
              const desc = m.coa?.description?.toLowerCase() ?? '';
              return typeMatch || code.includes(term) || desc.includes(term);
            })
          : data;
        return this.glMappings;
      }),
    );
  }

  loadCoaOptions(): Observable<ChartOfAccount[]> {
    return this.coaApi.getAccounts(undefined, true).pipe(
      map(data => {
        this.coaOptions = data.filter(coa => !coa.is_parent);
        return this.coaOptions;
      }),
    );
  }

  save(
    isEditMode: boolean,
    id: string | undefined,
    payload: GlMappingPayload,
  ): Observable<unknown> {
    return isEditMode && id
      ? this.glMappingsApi.updateMapping(id, payload)
      : this.glMappingsApi.createMapping(payload);
  }

  delete(id: string): Observable<unknown> {
    return this.glMappingsApi.deleteMapping(id);
  }

  getGLNumberDisplay(mapping: GlMapping): string {
    if (!mapping.coa) return '-';
    return `${mapping.coa.account_code} - ${mapping.coa.description}`;
  }
}
