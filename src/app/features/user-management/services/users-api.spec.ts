import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { UsersApi } from './users-api';

describe('UsersApi', () => {
  let api: UsersApi;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(UsersApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets users with filter params', () => {
    api.getUsers({ page: 1, search: 'jane', role_id: 'r-1', status: 'active' }).subscribe();
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('search')).toBe('jane');
    expect(req.request.params.get('role_id')).toBe('r-1');
    expect(req.request.params.get('status')).toBe('active');
    req.flush({ data: [], total: 0, page: 1, per_page: 20, total_pages: 0 });
  });

  it('invites a user', () => {
    const payload = { email: 'a@b.com', name: 'A', role_id: 'r-1', user_type: 'staff' };
    api.inviteUser(payload).subscribe();
    const req = httpMock.expectOne(`${base}/invite`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ message: 'ok' });
  });

  it('deactivates a single user', () => {
    api.deactivateUser('u-1').subscribe();
    const req = httpMock.expectOne(`${base}/u-1/deactivate`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok' });
  });

  it('deactivates users in bulk', () => {
    api.deactivateBulk(['u-1', 'u-2']).subscribe();
    const req = httpMock.expectOne(`${base}/deactivate-bulk`);
    expect(req.request.body).toEqual({ ids: ['u-1', 'u-2'] });
    req.flush({ message: 'ok', count: 2 });
  });

  it('updates user permissions', () => {
    api.updateUserPermissions('u-1', ['p-1', 'p-2']).subscribe();
    const req = httpMock.expectOne(`${base}/u-1/permissions`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ permissions: ['p-1', 'p-2'] });
    req.flush({ message: 'ok' });
  });

  it('gets pending invites', () => {
    api.getPendingInvites().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/invites/pending`);
    req.flush([]);
  });

  it('revokes an invite', () => {
    api.revokeInvite('i-1').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/invites/i-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });

  it('gets user stats', () => {
    api.getStats().subscribe();
    const req = httpMock.expectOne(`${base}/stats`);
    req.flush({ total: 0, active: 0, roles_defined: 0, pending_invites: 0 });
  });
});
