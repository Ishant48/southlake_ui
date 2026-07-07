import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleFormModal, SimpleFormValue, createBlankSimpleForm } from './simple-form-modal';
import { LineOfBusiness, CobMaster } from '../../models/master.model';

describe('SimpleFormModal', () => {
  let component: SimpleFormModal;
  let fixture: ComponentFixture<SimpleFormModal>;

  const sample: SimpleFormValue = {
    ...createBlankSimpleForm(),
    id: 'lob-1',
    code: 'TX',
    name: 'Texas',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleFormModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleFormModal);
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

  it('derives product code/name from the selected LOB and COB', () => {
    const lob: LineOfBusiness = { id: 'l1', lob_code: 'AUTO', name: 'Auto', is_active: true };
    const cob: CobMaster = { id: 'c1', cob_code: 'PHYS', name: 'Physical Damage', is_active: true };
    component.lobOptions = [lob];
    component.cobOptions = [cob];
    component.formValue = { ...createBlankSimpleForm(), lob_id: 'l1', cob_id: 'c1' };

    component.onProductLobCobChange();

    expect(component.formValue.code).toBe('AUTO-PHYS');
    expect(component.formValue.name).toBe('Auto - Physical Damage');
  });

  it('clears product code/name when LOB or COB is unselected', () => {
    component.lobOptions = [];
    component.cobOptions = [];
    component.formValue = {
      ...createBlankSimpleForm(),
      code: 'AUTO-PHYS',
      name: 'Auto - Physical Damage',
    };

    component.onProductLobCobChange();

    expect(component.formValue.code).toBe('');
    expect(component.formValue.name).toBe('');
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
    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});
