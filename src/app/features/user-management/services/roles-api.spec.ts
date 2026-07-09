import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { RolesApi } from './roles-api';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('RolesApi', () => {
  let api: RolesApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/roles`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RolesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets roles with pagination params', () => {
    api.getRoles({ page: 2, per_page: 10 }).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('per_page')).toBe('10');
    req.flush({ data: [], total: 0, page: 2, per_page: 10, total_pages: 0 });
  });

  it('gets a single role by id', () => {
    api.getRole('r-1').subscribe();
    const req = httpMock.expectOne(`${base}/r-1`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('creates a role', () => {
    const payload = { label: 'Underwriter', color: '#000', permissions: [] };
    api.createRole(payload).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('updates a role', () => {
    api.updateRole('r-1', { label: 'Updated' }).subscribe();
    const req = httpMock.expectOne(`${base}/r-1`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('deletes a role', () => {
    api.deleteRole('r-1').subscribe();
    const req = httpMock.expectOne(`${base}/r-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'deleted' });
  });
});
