import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { InvitePanelComponent } from './invite-panel.component';

describe('InvitePanelComponent', () => {
  let component: InvitePanelComponent;
  let fixture: ComponentFixture<InvitePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvitePanelComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InvitePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
