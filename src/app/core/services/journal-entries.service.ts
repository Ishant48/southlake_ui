import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JournalEntryBatch, JournalEntry } from '../models/journal-entry.model';

@Injectable({ providedIn: 'root' })
export class JournalEntriesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/journal-batches`;

  getBatches(period?: string, agent?: string, search?: string): Observable<JournalEntryBatch[]> {
    let params = new HttpParams();
    if (period) params = params.set('period', period);
    if (agent) params = params.set('agent', agent);
    if (search) params = params.set('search', search);
    return this.http.get<JournalEntryBatch[]>(this.base, { params });
  }

  getBatch(id: string): Observable<JournalEntryBatch> {
    return this.http.get<JournalEntryBatch>(`${this.base}/${id}`);
  }

  createBatch(payload: { batch_number: string; period: string; agent_name: string }): Observable<JournalEntryBatch> {
    return this.http.post<JournalEntryBatch>(this.base, payload);
  }

  updateBatch(id: string, payload: Partial<{ batch_number: string; period: string; agent_name: string }>): Observable<JournalEntryBatch> {
    return this.http.patch<JournalEntryBatch>(`${this.base}/${id}`, payload);
  }

  deleteBatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getBatchEntries(batchId: string): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(`${this.base}/${batchId}/entries`);
  }

  postEntries(batchId: string, payload: { je_number: number; lines: any[] }): Observable<JournalEntry[]> {
    return this.http.post<JournalEntry[]>(`${this.base}/${batchId}/entries`, payload);
  }
}
