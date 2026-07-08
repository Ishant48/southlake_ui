import { TestBed } from '@angular/core/testing';
import { PermissionGroupingService } from './permission-grouping.service';
import { Module, Permission } from '../models/permission.model';
import { beforeEach, describe, expect, it } from 'vitest';

describe('PermissionGroupingService', () => {
  let service: PermissionGroupingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissionGroupingService);
  });

  function makeModule(overrides: Partial<Module> = {}): Module {
    return {
      id: 'mod',
      label: 'Module',
      isActive: true,
      route: null,
      sortOrder: 0,
      parentModuleId: null,
      permissionAction: null,
      ...overrides,
    };
  }

  it('matches permissions to their owning module via exact permissionAction match', () => {
    const modules: Module[] = [
      makeModule({ id: 'users', label: 'Users', route: '/users', permissionAction: 'user.view' }),
    ];
    const permissions: Permission[] = [{ id: 'p1', action: 'user.view', label: 'View Users' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Users');
    expect(groups[0].permissions).toEqual([{ id: 'p1', action: 'user.view', label: 'View Users' }]);
  });

  it('does not match permissions by prefix guessing', () => {
    const modules: Module[] = [
      makeModule({
        id: 'treaties',
        label: 'Treaties',
        route: '/treaties',
        permissionAction: 'treaty.view',
      }),
    ];
    const permissions: Permission[] = [
      { id: 'p1', action: 'treaty.create', label: 'Create Treaties' },
    ];

    const groups = service.buildGroups(modules, permissions);
    expect(groups[0].permissions).toEqual([]);
  });

  it('treats parent-only modules (no route/permissionAction, has children) as non-selectable headers, not leaves', () => {
    const modules: Module[] = [
      makeModule({ id: 'parent', label: 'Config Tools', route: null, permissionAction: null }),
      makeModule({
        id: 'child',
        label: 'Treaties',
        route: '/treaties',
        permissionAction: 'treaty.view',
        parentModuleId: 'parent',
      }),
    ];
    const permissions: Permission[] = [{ id: 'p1', action: 'treaty.view', label: 'View Treaties' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Config Tools');
    // The header module itself must not appear as a submodule row
    expect(groups[0].subModules.map(s => s.name)).toEqual(['Treaties']);
    expect(groups[0].subModules.map(s => s.name)).not.toContain('Config Tools');
  });

  it('excludes modules where isActive is false', () => {
    const modules: Module[] = [
      makeModule({
        id: 'inactive',
        label: 'Retired',
        route: '/retired',
        permissionAction: 'retired.view',
        isActive: false,
      }),
    ];
    const permissions: Permission[] = [{ id: 'p1', action: 'retired.view', label: 'View Retired' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups.every(g => g.name !== 'Retired')).toBe(true);
    // Orphaned permission from the excluded module lands in General
    const general = groups.find(g => g.name === 'General');
    expect(general).toBeTruthy();
    expect(general?.permissions.map(p => p.id)).toContain('p1');
  });

  it('puts an orphan permission with no matching module into a General bucket', () => {
    const modules: Module[] = [
      makeModule({ id: 'users', label: 'Users', route: '/users', permissionAction: 'user.view' }),
    ];
    const permissions: Permission[] = [
      { id: 'p1', action: 'user.view', label: 'View Users' },
      { id: 'p2', action: 'mystery.action', label: 'Mystery Action' },
    ];

    const groups = service.buildGroups(modules, permissions);
    const general = groups.find(g => g.name === 'General');
    expect(general).toBeTruthy();
    expect(general?.permissions).toEqual([
      { id: 'p2', action: 'mystery.action', label: 'Mystery Action' },
    ]);
  });

  it('does not create a General bucket when there are no orphan permissions', () => {
    const modules: Module[] = [
      makeModule({ id: 'users', label: 'Users', route: '/users', permissionAction: 'user.view' }),
    ];
    const permissions: Permission[] = [{ id: 'p1', action: 'user.view', label: 'View Users' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups.some(g => g.name === 'General')).toBe(false);
  });
});
