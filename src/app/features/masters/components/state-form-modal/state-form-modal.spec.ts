import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateFormModal, StateFormValue } from './state-form-modal';

describe('StateFormModal', () => {
  let component: StateFormModal;
  let fixture: ComponentFixture<StateFormModal>;

  const sampleState: StateFormValue = {
    id: 's-1',
    state_code: 48,
    state_abbr: 'TX',
    name: 'Texas',
    notes: 'Some notes',
    is_active: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StateFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(StateFormModal);
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

  it('copies the model input into local formValue on change', () => {
    component.model = sampleState;
    component.ngOnChanges({
      model: {
        currentValue: sampleState,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(sampleState);
    expect(component.formValue).not.toBe(sampleState);
  });

  it('emits save with the current form value', () => {
    component.model = sampleState;
    component.ngOnChanges({
      model: {
        currentValue: sampleState,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(sampleState);
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
