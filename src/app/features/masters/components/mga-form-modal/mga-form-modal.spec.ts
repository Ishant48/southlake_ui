import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MgaFormModal, MgaFormValue, createBlankMgaForm } from './mga-form-modal';

describe('MgaFormModal', () => {
  let component: MgaFormModal;
  let fixture: ComponentFixture<MgaFormModal>;

  const sample: MgaFormValue = {
    ...createBlankMgaForm(),
    id: 'mga-1',
    mga_code: 'MGA-100',
    name: 'Southlake Underwriters',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MgaFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MgaFormModal);
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

  it('copies the model into local formValue on change', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(sample);
  });

  it('emits save with the current form value', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith(component.formValue);
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
