import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { RoleFormComponent } from './role-form.component';
import { environment } from '../../../../../environments/environment';
import { describe, afterEach, it, expect, vi } from 'vitest';

describe('RoleFormComponent', () => {
  let component: RoleFormComponent;
  let fixture: ComponentFixture<RoleFormComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  const modules = [
    {
      id: 'user_management',
      label: 'User Management',
      isActive: true,
      route: null,
      sortOrder: 1,
      parentModuleId: null,
      permissionAction: null,
    },
    {
      id: 'users',
      label: 'Users',
      isActive: true,
      route: '/users',
      sortOrder: 1,
      parentModuleId: 'user_management',
      permissionAction: 'user.view',
    },
  ];
  const permissions = [
    { id: 'p1', action: 'user.view', label: 'View Users' },
    { id: 'p2', action: 'orphan.action', label: 'Orphan Action' },
  ];

  function createComponent(paramMapValue: string | null = null): void {
    TestBed.configureTestingModule({
      imports: [RoleFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => paramMapValue } } },
        },
      ],
    });

    fixture = TestBed.createComponent(RoleFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('loads modules and permissions via forkJoin and builds groups', () => {
    createComponent();

    const modulesReq = httpMock.expectOne(`${environment.apiUrl}/permissions/modules`);
    modulesReq.flush(modules);
    const permsReq = httpMock.expectOne(`${environment.apiUrl}/permissions`);
    permsReq.flush(permissions);

    expect(component.allPermissions).toEqual(permissions);
    expect(component.parentModuleGroups.length).toBeGreaterThan(0);
  });

  it('has no name form control', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);

    expect(component.form.get('name')).toBeNull();
    expect(component.form.get('label')).toBeTruthy();
  });

  it('onSave payload never contains a name key', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);

    component.form.patchValue({ label: 'Underwriter' });
    component.selectedIds.add('p1');
    component.onSave();

    const saveReq = httpMock.expectOne(`${environment.apiUrl}/roles`);
    expect(saveReq.request.body).not.toHaveProperty('name');
    expect(saveReq.request.body.label).toBe('Underwriter');
    saveReq.flush({});
  });

  it('filters modules and permissions by search term', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);

    component.searchTerm = 'orphan';
    const filtered = component.filteredParentModuleGroups;
    const allPerms = filtered.flatMap(g => g.permissions);
    expect(allPerms.some(p => p.action === 'orphan.action')).toBe(true);
    expect(allPerms.some(p => p.action === 'user.view')).toBe(false);
  });

  it('onCancel navigates to /user-management/roles', () => {
    createComponent();
    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);

    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onCancel();
    expect(navigateSpy).toHaveBeenCalledWith(['/user-management/roles']);
  });

  it('keeps label editable when the role is a system role', () => {
    createComponent('r-1');
    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);

    const roleReq = httpMock.expectOne(`${environment.apiUrl}/roles/r-1`);
    roleReq.flush({
      id: 'r-1',
      name: 'superadmin',
      label: 'Super Admin',
      color: '#000',
      is_system: true,
      user_count: 1,
      permissions: [],
    });

    expect(component.form.get('label')?.disabled).toBe(false);
  });
});
