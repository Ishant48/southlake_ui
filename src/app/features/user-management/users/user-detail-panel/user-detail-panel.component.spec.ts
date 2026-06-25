import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserDetailPanelComponent } from './user-detail-panel.component';

describe('UserDetailPanelComponent', () => {
  let component: UserDetailPanelComponent;
  let fixture: ComponentFixture<UserDetailPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDetailPanelComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
