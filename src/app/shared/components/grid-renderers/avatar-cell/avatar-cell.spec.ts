import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarCell, AvatarCellRendererParams } from './avatar-cell';

describe('AvatarCell', () => {
  let component: AvatarCell;
  let fixture: ComponentFixture<AvatarCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarCell],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads a user object nested under data.user', () => {
    component.agInit({
      data: { user: { name: 'Jane Doe', email: 'jane@example.com', avatar_color: '#123456' } },
    } as unknown as AvatarCellRendererParams);

    expect(component.name).toBe('Jane Doe');
    expect(component.email).toBe('jane@example.com');
    expect(component.avatarColor).toBe('#123456');
    expect(component.initials).toBe('JD');
  });

  it('falls back to a plain string value when no user object is present', () => {
    component.agInit({ value: 'Solo User' } as unknown as AvatarCellRendererParams);

    expect(component.name).toBe('Solo User');
    expect(component.initials).toBe('SU');
  });

  it('defaults to "Unknown User" when the user has no name', () => {
    component.agInit({ data: { user: {} } } as unknown as AvatarCellRendererParams);
    expect(component.name).toBe('Unknown User');
    expect(component.initials).toBe('UU');
  });
});
