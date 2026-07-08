import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DropdownSearchComponent } from '../../../../shared/components/dropdown-search/dropdown-search.component';
import { LineOfBusiness, CobMaster } from '../../models/master.model';
import { SimpleForm, SimpleFormModel } from '../../forms/simple-form';
import { SimpleMode, SimpleFormValue, createBlankSimpleForm } from '../../models/simple-form.model';

export { SimpleMode, SimpleFormValue, createBlankSimpleForm } from '../../models/simple-form.model';

@Component({
  selector: 'app-simple-form-modal',
  imports: [CommonModule, ReactiveFormsModule, DropdownSearchComponent],
  templateUrl: './simple-form-modal.html',
  styleUrl: './simple-form-modal.scss',
})
export class SimpleFormModal implements OnChanges {
  private simpleFormService = inject(SimpleForm);

  protected readonly SimpleMode = SimpleMode;

  @Input() open = false;
  @Input() title = '';
  @Input() mode: SimpleMode = SimpleMode.Lob;
  @Input() model: SimpleFormValue = createBlankSimpleForm();
  @Input() isEditMode = false;
  @Input() submitting = false;
  @Input() lobOptions: LineOfBusiness[] = [];
  @Input() cobOptions: CobMaster[] = [];
  @Input() lobLabelFn: (item: LineOfBusiness) => string = () => '';
  @Input() cobLabelFn: (item: CobMaster) => string = () => '';
  @Input() typeOptions: { id: string; name: string }[] = [];
  @Input() nameLabelFn: (item: { id: string; name: string }) => string = () => '';

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<SimpleFormValue>();

  form: FormGroup<SimpleFormModel> = this.simpleFormService.createForm();
  showFormError = false;

  selectedLobsDict: { [key: string]: boolean } = {};
  selectedCobsDict: { [key: string]: boolean } = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.simpleFormService.patchForm(this.form, this.model);
      this.syncFormToDicts();
    }
    if (changes['mode'] || changes['isEditMode']) {
      if (this.isEditMode) {
        this.form.controls.code.disable();
      } else {
        this.form.controls.code.enable();
      }
      this.form.controls.name.enable();
    }
  }

  syncFormToDicts(): void {
    const lobs = this.form.controls.lob_id.value;
    const cobs = this.form.controls.cob_id.value;

    const lobDict: { [key: string]: boolean } = {};
    if (Array.isArray(lobs)) {
      lobs.forEach(id => {
        if (id) lobDict[id] = true;
      });
    } else if (typeof lobs === 'string' && lobs) {
      lobs.split(',').forEach(id => {
        if (id) lobDict[id] = true;
      });
    }
    this.selectedLobsDict = lobDict;

    const cobDict: { [key: string]: boolean } = {};
    if (Array.isArray(cobs)) {
      cobs.forEach(id => {
        if (id) cobDict[id] = true;
      });
    } else if (typeof cobs === 'string' && cobs) {
      cobs.split(',').forEach(id => {
        if (id) cobDict[id] = true;
      });
    }
    this.selectedCobsDict = cobDict;
  }

  onLobsDictChange(dict: { [key: string]: boolean }): void {
    this.selectedLobsDict = dict;
    const activeIds = Object.keys(dict).filter(key => dict[key]);
    this.form.controls.lob_id.setValue(activeIds);
  }

  onCobsDictChange(dict: { [key: string]: boolean }): void {
    this.selectedCobsDict = dict;
    const activeIds = Object.keys(dict).filter(key => dict[key]);
    this.form.controls.cob_id.setValue(activeIds);
  }

  onProductLobCobChange(): void {
    // Disabled auto-fill to allow manual entry of Product ID and Product Name
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.showFormError = true;
      return;
    }
    this.showFormError = false;
    this.save.emit(this.simpleFormService.toFormValue(this.form));
  }
}
