import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SimpleMasterRecord } from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/masters/products`;

  getProducts(search?: string, isActive?: boolean): Observable<SimpleMasterRecord[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined) params = params.set('is_active', isActive.toString());
    return this.http.get<SimpleMasterRecord[]>(this.base, { params });
  }

  createProduct(payload: SimpleMasterRecord): Observable<SimpleMasterRecord> {
    return this.http.post<SimpleMasterRecord>(this.base, payload);
  }

  updateProduct(id: string, payload: SimpleMasterRecord): Observable<SimpleMasterRecord> {
    return this.http.patch<SimpleMasterRecord>(`${this.base}/${id}`, payload);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
