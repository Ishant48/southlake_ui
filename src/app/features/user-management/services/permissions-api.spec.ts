import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { PermissionsApi } from './permissions-api';

describe('PermissionsApi', () => {
  let api: PermissionsApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PermissionsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets modules', () => {
    api.getModules().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/permissions/modules`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets permissions', () => {
    api.getPermissions().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/permissions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
