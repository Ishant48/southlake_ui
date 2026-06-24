import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RolePermissionsModalComponent } from './role-permissions-modal.component';

describe('RolePermissionsModalComponent', () => {
  let component: RolePermissionsModalComponent;
  let fixture: ComponentFixture<RolePermissionsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolePermissionsModalComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RolePermissionsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
