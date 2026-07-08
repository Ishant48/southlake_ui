import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserDetailPanelComponent } from './user-detail-panel.component';
import { environment } from '../../../../../environments/environment';
import { PanelMode } from '../../models/user.model';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('UserDetailPanelComponent', () => {
  let component: UserDetailPanelComponent;
  let fixture: ComponentFixture<UserDetailPanelComponent>;
  let httpMock: HttpTestingController;

  const modules = [
    {
      id: 'users',
      label: 'Users',
      isActive: true,
      route: '/users',
      sortOrder: 1,
      parentModuleId: null,
      permissionAction: 'user.view',
    },
  ];
  const permissions = [
    { id: 'p1', action: 'user.view', label: 'View Users' },
    { id: 'p2', action: 'orphan.action', label: 'Orphan Action' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailPanelComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailPanelComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads module-based permission groups via forkJoin on loadPermissionsTab', () => {
    component.user = {
      id: 'u1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'active',
    } as never;

    component.loadPermissionsTab();

    httpMock.expectOne(`${environment.apiUrl}/permissions/modules`).flush(modules);
    httpMock.expectOne(`${environment.apiUrl}/permissions`).flush(permissions);
    httpMock.expectOne(`${environment.apiUrl}/users/u1/permissions`).flush([]);

    expect(component.allPermissions).toEqual(permissions);
    expect(component.parentModuleGroups.some(g => g.name === 'Users')).toBe(true);
    expect(component.parentModuleGroups.some(g => g.name === 'General')).toBe(true);
  });

  it('filters module groups by search term', () => {
    component.parentModuleGroups = [
      {
        name: 'Users',
        icon: 'grid',
        permissions: [{ id: 'p1', action: 'user.view', label: 'View Users' }],
        subModules: [
          { name: 'Users', permissions: [{ id: 'p1', action: 'user.view', label: 'View Users' }] },
        ],
      },
      {
        name: 'General',
        icon: 'admin',
        permissions: [{ id: 'p2', action: 'orphan.action', label: 'Orphan Action' }],
        subModules: [
          {
            name: 'General',
            permissions: [{ id: 'p2', action: 'orphan.action', label: 'Orphan Action' }],
          },
        ],
      },
    ];

    component.searchTerm = 'orphan';
    const filtered = component.filteredModuleGroups;
    expect(filtered.map(g => g.name)).toEqual(['General']);

    component.searchTerm = '';
    expect(component.filteredModuleGroups.map(g => g.name)).toEqual(['Users', 'General']);
  });

  it('resets module groups and search term when the panel closes', () => {
    component.parentModuleGroups = [
      { name: 'Users', icon: 'grid', permissions: [], subModules: [] },
    ];
    component.searchTerm = 'foo';
    component.open = true;
    fixture.detectChanges();

    component.open = false;
    component.ngOnChanges({
      open: {
        currentValue: false,
        previousValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.parentModuleGroups).toEqual([]);
    expect(component.searchTerm).toBe('');
  });

  it('blocks saveProfile when the display name is whitespace-only in edit mode', () => {
    component.user = {
      id: 'u1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'active',
    } as never;
    component.mode = PanelMode.Edit;
    component.editName = '   ';

    component.saveProfile();

    expect(component.profileError).toBe('Display name is required');
    expect(component.savingProfile).toBe(false);
    httpMock.expectNone(`${environment.apiUrl}/users/u1`);
  });
});
