import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItdFormModal, ItdFormValue, ItdExhibit } from './itd-form-modal';

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

  it('recomputes month_key and month_label from the selected month/year', () => {
    component.monthsList = [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
    ];
    component.formValue = { ...sample, exhibits: { ...sample.exhibits } };
    component.selectedMonth = '02';
    component.selectedYear = '2026';

    component.onMonthYearChange();

    expect(component.formValue.month_key).toBe('2026-02');
    expect(component.formValue.month_label).toBe('February 2026');
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
      '.btn-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
