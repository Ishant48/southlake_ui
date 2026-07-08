import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { TreatyTypesApi } from './treaty-types-api';

describe('TreatyTypesApi', () => {
  let service: TreatyTypesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TreatyTypesApi],
    });
    service = TestBed.inject(TreatyTypesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets all treaty types', () => {
    service.getTreatyTypes('Quota', true).subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(
      r =>
        r.url === `${environment.apiUrl}/masters/treaty-types` &&
        r.params.get('search') === 'Quota' &&
        r.params.get('is_active') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'tt-1', name: 'Quota Share', typeCode: 'QS' }]);
  });

  it('creates a treaty type', () => {
    const payload = { name: 'Quota Share', type_code: 'QS' };
    service.createTreatyType(payload).subscribe(res => {
      expect(res.name).toBe('Quota Share');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/masters/treaty-types`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'tt-1', name: 'Quota Share', typeCode: 'QS' });
  });

  it('updates a treaty type', () => {
    const payload = { name: 'Quota Share Updated' };
    service.updateTreatyType('tt-1', payload).subscribe(res => {
      expect(res.name).toBe('Quota Share Updated');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/masters/treaty-types/tt-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'tt-1', name: 'Quota Share Updated', typeCode: 'QS' });
  });

  it('deletes a treaty type', () => {
    service.deleteTreatyType('tt-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/masters/treaty-types/tt-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
