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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.simpleFormService.patchForm(this.form, this.model);
    }
    if (changes['mode'] || changes['isEditMode']) {
      const isProduct = this.mode === SimpleMode.Product;
      if (this.isEditMode || isProduct) {
        this.form.controls.code.disable();
      } else {
        this.form.controls.code.enable();
      }
      if (isProduct) {
        this.form.controls.name.disable();
      } else {
        this.form.controls.name.enable();
      }
    }
  }

  onProductLobCobChange(): void {
    const selectedLob = this.lobOptions.find(l => l.id === this.form.controls.lob_id.value);
    const selectedCob = this.cobOptions.find(c => c.id === this.form.controls.cob_id.value);

    const lobCode = selectedLob ? selectedLob.lob_code : '';
    const cobCode = selectedCob ? selectedCob.cob_code : '';

    if (lobCode && cobCode) {
      this.form.controls.code.setValue(`${lobCode}-${cobCode}`);
      this.form.controls.name.setValue(`${selectedLob?.name} - ${selectedCob?.name}`);
    } else {
      this.form.controls.code.setValue('');
      this.form.controls.name.setValue('');
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.simpleFormService.toFormValue(this.form));
  }
}
