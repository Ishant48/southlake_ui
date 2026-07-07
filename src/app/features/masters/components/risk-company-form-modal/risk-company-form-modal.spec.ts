import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  RiskCompanyFormModal,
  RiskCompanyFormValue,
  createBlankRiskCompanyForm,
} from './risk-company-form-modal';

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
    expect(component.formValue).not.toBe(sample);
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

    expect(saveSpy).toHaveBeenCalledWith(sample);
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
