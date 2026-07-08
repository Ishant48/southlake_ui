import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function storeUser(user: Record<string, unknown>): void {
    service.storeSession({ user: user as never });
  }

  describe('hasPermission', () => {
    it('grants everything to a superadmin via the boolean flag, regardless of role name', () => {
      storeUser({
        is_super_admin: true,
        role: { name: 'some_custom_role', label: 'Custom' },
        permissions: [],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(true);
      expect(service.hasPermission('anything.at.all')).toBe(true);
    });

    it('does not grant access purely from a role named superadmin without the boolean flag', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'superadmin', label: 'Super Admin' },
        permissions: [],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(false);
    });

    it('checks the object-array permissions with the 1-argument signature', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'staff', label: 'Staff' },
        permissions: [{ id: 'p1', action: 'user.view' }],
      });
      expect(service.hasPermission('user.view')).toBe(true);
      expect(service.hasPermission('user.delete')).toBe(false);
    });

    it('checks the object-array permissions with the 2-argument (module, action) signature', () => {
      storeUser({
        is_super_admin: false,
        role: { name: 'staff', label: 'Staff' },
        permissions: [{ module_id: 'user_management', action: 'view' }],
      });
      expect(service.hasPermission('user_management', 'view')).toBe(true);
      expect(service.hasPermission('user_management', 'delete')).toBe(false);
    });

    it('returns false when there is no current user', () => {
      expect(service.hasPermission('user.view')).toBe(false);
    });

    it('returns false when permissions is missing entirely', () => {
      storeUser({ is_super_admin: false, role: { name: 'staff', label: 'Staff' } });
      expect(service.hasPermission('user.view')).toBe(false);
      expect(service.hasPermission('user_management', 'view')).toBe(false);
    });
  });
});
