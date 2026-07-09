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
      is_active: true,
      route: null,
      sort_order: 0,
      parent_module_id: null,
      permission_action: null,
      ...overrides,
    };
  }

  it('matches permissions to their owning module by action prefix against module id', () => {
    const modules: Module[] = [makeModule({ id: 'user', label: 'Users', route: '/users' })];
    const permissions: Permission[] = [
      { id: 'p1', action: 'user.view', label: 'View Users' },
      { id: 'p2', action: 'user.create', label: 'Create Users' },
    ];

    const groups = service.buildGroups(modules, permissions);
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Users');
    expect(groups[0].permissions.map(p => p.id).sort()).toEqual(['p1', 'p2']);
  });

  it('does not match a permission whose prefix belongs to a different module', () => {
    const modules: Module[] = [makeModule({ id: 'treaty', label: 'Treaties', route: '/treaties' })];
    const permissions: Permission[] = [{ id: 'p1', action: 'mga.create', label: 'Create MGAs' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups[0].permissions).toEqual([]);
  });

  it('ignores permission_action for matrix grouping (it only gates sidebar view visibility)', () => {
    // 'role' module in real seed data has permission_action='role.manage', but the matrix must
    // still show every role.* permission (view/create/edit/delete/manage), not just 'role.manage'.
    const modules: Module[] = [
      makeModule({
        id: 'role',
        label: 'Roles',
        route: '/user-management/roles',
        permission_action: 'role.manage',
      }),
    ];
    const permissions: Permission[] = [
      { id: 'p1', action: 'role.view', label: 'View Roles' },
      { id: 'p2', action: 'role.manage', label: 'Manage Roles' },
    ];

    const groups = service.buildGroups(modules, permissions);
    expect(groups[0].permissions.map(p => p.id).sort()).toEqual(['p1', 'p2']);
  });

  it('treats parent-only modules (no route, has children) as non-selectable headers, not leaves', () => {
    const modules: Module[] = [
      makeModule({ id: 'parent', label: 'Config Tools', route: null }),
      makeModule({
        id: 'treaty',
        label: 'Treaties',
        route: '/treaties',
        parent_module_id: 'parent',
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

  it('excludes modules where is_active is false', () => {
    const modules: Module[] = [
      makeModule({ id: 'retired', label: 'Retired', route: '/retired', is_active: false }),
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
    const modules: Module[] = [makeModule({ id: 'user', label: 'Users', route: '/users' })];
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
    const modules: Module[] = [makeModule({ id: 'user', label: 'Users', route: '/users' })];
    const permissions: Permission[] = [{ id: 'p1', action: 'user.view', label: 'View Users' }];

    const groups = service.buildGroups(modules, permissions);
    expect(groups.some(g => g.name === 'General')).toBe(false);
  });
});
