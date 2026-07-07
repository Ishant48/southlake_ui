import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBatchModal } from './add-batch-modal';

describe('AddBatchModal', () => {
  let component: AddBatchModal;
  let fixture: ComponentFixture<AddBatchModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBatchModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AddBatchModal);
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

  it('displays the given period as readonly', () => {
    component.open = true;
    component.period = '2026-01';
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      '#je-add-batch-period',
    ) as HTMLInputElement;
    expect(input.value).toBe('2026-01');
    expect(input.readOnly).toBe(true);
  });

  it('emits add when the Add button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const addSpy = vi.fn();
    component.add.subscribe(addSpy);

    const addBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-primary',
    ) as HTMLButtonElement;
    addBtn.click();

    expect(addSpy).toHaveBeenCalled();
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.close-btn',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
