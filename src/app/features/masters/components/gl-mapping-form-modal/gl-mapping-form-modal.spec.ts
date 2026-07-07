import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlMappingFormModal } from './gl-mapping-form-modal';
import { GlMappingFormValue } from '../../models/gl-mapping-form.model';

describe('GlMappingFormModal', () => {
  let component: GlMappingFormModal;
  let fixture: ComponentFixture<GlMappingFormModal>;

  const sample: GlMappingFormValue = { id: 'm-1', coa_id: 'coa-1', type: 'AR' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlMappingFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(GlMappingFormModal);
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

  it('patches the form from the model input on change', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.getRawValue()).toEqual(sample);
  });

  it('emits save with the current form value when valid', () => {
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

    expect(saveSpy).toHaveBeenCalledWith(sample);
  });

  it('does not emit save when the form is invalid', () => {
    component.model = { ...sample, coa_id: '', type: '' };
    component.ngOnChanges({
      model: {
        currentValue: component.model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).not.toHaveBeenCalled();
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
