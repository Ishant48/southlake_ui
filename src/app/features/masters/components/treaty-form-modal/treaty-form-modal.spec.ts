import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreatyFormModal, TreatyFormShape, createBlankTreatyForm } from './treaty-form-modal';

describe('TreatyFormModal', () => {
  let component: TreatyFormModal;
  let fixture: ComponentFixture<TreatyFormModal>;

  const sample: TreatyFormShape = {
    ...createBlankTreatyForm(),
    id: 'treaty-1',
    treaty_code: 'TR-100',
    name: 'Casualty QS',
    carriers: [{ risk_company_id: 'rc-1', retention_pct: 100 }],
    reinsurers: [{ reinsurer_id: 're-1', cession_pct: 50 }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatyFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(TreatyFormModal);
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

  it('copies the model and selection maps into local state on change, cloning arrays', () => {
    const selectedStates = { s1: true };
    component.model = sample;
    component.selectedStates = selectedStates;
    component.ngOnChanges({
      model: {
        currentValue: sample,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
      selectedStates: {
        currentValue: selectedStates,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.formValue).toEqual(sample);
    expect(component.formValue.carriers).not.toBe(sample.carriers);
    expect(component.formValue.reinsurers).not.toBe(sample.reinsurers);
    expect(component.formSelectedStates).toEqual(selectedStates);
    expect(component.formSelectedStates).not.toBe(selectedStates);
  });

  it('adds and removes reinsurer rows', () => {
    component.formValue = { ...createBlankTreatyForm(), reinsurers: [] };

    component.addReinsurerRow();
    expect(component.formValue.reinsurers).toEqual([{ reinsurer_id: '', cession_pct: 0 }]);

    component.addReinsurerRow();
    expect(component.formValue.reinsurers.length).toBe(2);

    component.removeReinsurerRow(0);
    expect(component.formValue.reinsurers.length).toBe(1);
  });

  it('emits save with the form value and selection maps', () => {
    component.formValue = { ...sample };
    component.formSelectedStates = { s1: true };
    component.formSelectedLobs = { l1: true };
    component.formSelectedCobs = { c1: true };
    const saveSpy = vi.fn();
    component.save.subscribe(saveSpy);

    component.submit();

    expect(saveSpy).toHaveBeenCalledWith({
      form: component.formValue,
      selectedStates: { s1: true },
      selectedLobs: { l1: true },
      selectedCobs: { c1: true },
    });
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
