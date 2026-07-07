import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdFormModal } from './itd-form-modal';
import { ItdExhibit, ItdFormValue } from '../../models/itd.model';

describe('ItdFormModal', () => {
  let component: ItdFormModal;
  let fixture: ComponentFixture<ItdFormModal>;

  const blankExhibit: ItdExhibit = {
    uep: 0,
    loss_reserves: 0,
    loss_ibnr: 0,
    lae_reserves_dcc: 0,
    lae_ibnr_dcc: 0,
    lae_reserves_aoe: 0,
    lae_ibnr_aoe: 0,
    ulae_ibnr: 0,
  };

  const sample: ItdFormValue = {
    program: 'Program A',
    month_key: '2025-12',
    month_label: 'December 2025',
    exhibits: { TOTAL: { ...blankExhibit } },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItdFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ItdFormModal);
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
    expect(component.form.controls.exhibits.value).not.toBe(sample.exhibits);
  });

  it('recomputes month_key and month_label from the selected month/year', () => {
    component.monthsList = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
    ];
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    component.selectedMonth = '02';
    component.selectedYear = '2026';

    component.onMonthYearChange();

    expect(component.form.controls.month_key.value).toBe('2026-02');
    expect(component.form.controls.month_label.value).toBe('February 2026');
  });

  it('updates only the targeted exhibit field for the selected state', () => {
    component.model = sample;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    component.selectedStateCode = 'TOTAL';

    component.updateExhibitField('TOTAL', 'loss_reserves', 500);

    expect(component.form.controls.exhibits.value['TOTAL'].loss_reserves).toBe(500);
    expect(component.form.controls.exhibits.value['TOTAL'].uep).toBe(0);
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
    component.model = { ...sample, program: '' };
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
      '.btn-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
