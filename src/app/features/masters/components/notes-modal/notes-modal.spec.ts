import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesModal } from './notes-modal';

describe('NotesModal', () => {
  let component: NotesModal;
  let fixture: ComponentFixture<NotesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotesModal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    component.open = false;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal-overlay')).toBeNull();
  });

  it('renders the title and text when open', () => {
    component.open = true;
    component.title = 'State Notes: California';
    component.text = 'Some notes text';
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('State Notes: California');
    expect(text).toContain('Some notes text');
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
