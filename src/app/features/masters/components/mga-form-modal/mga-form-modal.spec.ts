import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MgaFormModal } from './mga-form-modal';
import { MgaFormValue, createBlankMgaForm } from '../../models/mga-form.model';

describe('MgaFormModal', () => {
  let component: MgaFormModal;
  let fixture: ComponentFixture<MgaFormModal>;

  const sample: MgaFormValue = {
    ...createBlankMgaForm(),
    id: 'mga-1',
    mga_code: 'MGA-100',
    name: 'Southlake Underwriters',
    company_id: 123,
    id_name: 'Southlake ID',
    address: '123 Southlake Blvd',
    zip: '76092',
    city: 'Southlake',
    state: 'TX',
    phone: '817-555-0100',
    op_start_date: '2026-01-01',
    other_names: [{ state: 'TX', displayName: 'Southlake TX' }],
    contact_name: 'John Doe',
    contact_email: 'john@doe.com',
    contact_phone: '817-555-0101',
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

  it('adds and removes other-name rows', () => {
    component.model = { ...createBlankMgaForm(), other_names: [] };
    component.ngOnChanges({
      model: {
        currentValue: component.model,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.addOtherNameRow();
    expect(component.form.controls.other_names.value).toEqual([{ state: '', displayName: '' }]);

    component.addOtherNameRow();
    expect(component.form.controls.other_names.value.length).toBe(2);

    component.removeOtherNameRow(0);
    expect(component.form.controls.other_names.value.length).toBe(1);
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

  it('disables the mga code field in edit mode', () => {
    component.isEditMode = true;
    component.ngOnChanges({
      isEditMode: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
    expect(component.form.controls.mga_code.disabled).toBe(true);
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
