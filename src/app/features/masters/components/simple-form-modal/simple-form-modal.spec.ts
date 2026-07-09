import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleFormModal } from './simple-form-modal';
import { SimpleFormValue, SimpleMode, createBlankSimpleForm } from '../../models/simple-form.model';
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

  it('leaves product code/name untouched, allowing manual entry, when LOB/COB change', () => {
    const lob: LineOfBusiness = { id: 'l1', lob_code: 'AUTO', name: 'Auto', is_active: true };
    const cob: CobMaster = { id: 'c1', cob_code: 'PHYS', name: 'Physical Damage', is_active: true };
    component.lobOptions = [lob];
    component.cobOptions = [cob];
    component.model = {
      ...createBlankSimpleForm(),
      lob_id: ['l1'],
      cob_id: ['c1'],
      code: 'MANUAL-CODE',
      name: 'Manual Name',
    };
    component.ngOnChanges({
      model: {
        currentValue: component.model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.onProductLobCobChange();

    expect(component.form.controls.code.value).toBe('MANUAL-CODE');
    expect(component.form.controls.name.value).toBe('Manual Name');
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

  it('does not emit save when code or name is missing', () => {
    component.model = { ...sample, code: '', name: '' };
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

  it('disables code in edit mode', () => {
    component.isEditMode = true;
    component.ngOnChanges({
      isEditMode: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.controls.code.disabled).toBe(true);
    expect(component.form.controls.name.disabled).toBe(false);
  });

  it('keeps code and name manually editable in Product mode', () => {
    component.mode = SimpleMode.Product;
    component.ngOnChanges({
      mode: {
        currentValue: SimpleMode.Product,
        previousValue: SimpleMode.Lob,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.controls.code.disabled).toBe(false);
    expect(component.form.controls.name.disabled).toBe(false);
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
