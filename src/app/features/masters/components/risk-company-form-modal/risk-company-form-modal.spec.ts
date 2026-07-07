import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiskCompanyFormModal } from './risk-company-form-modal';
import {
  RiskCompanyFormValue,
  createBlankRiskCompanyForm,
} from '../../models/risk-company-form.model';

describe('RiskCompanyFormModal', () => {
  let component: RiskCompanyFormModal;
  let fixture: ComponentFixture<RiskCompanyFormModal>;

  const sample: RiskCompanyFormValue = {
    ...createBlankRiskCompanyForm(),
    id: 'rc-1',
    name: 'Acme Risk',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskCompanyFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(RiskCompanyFormModal);
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
    component.model = { ...sample, name: '' };
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

  it('disables company_id in edit mode', () => {
    component.isEditMode = true;
    component.ngOnChanges({
      isEditMode: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.controls.company_id.disabled).toBe(true);

    component.isEditMode = false;
    component.ngOnChanges({
      isEditMode: {
        currentValue: false,
        previousValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(component.form.controls.company_id.disabled).toBe(false);
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
