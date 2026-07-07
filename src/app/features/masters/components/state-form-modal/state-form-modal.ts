import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StateFormValue {
  id?: string;
  state_code: number | null;
  state_abbr: string;
  name: string;
  notes: string;
  is_active: boolean;
}

export function createBlankStateForm(): StateFormValue {
  return { state_code: null, state_abbr: '', name: '', notes: '', is_active: true };
}

@Component({
  selector: 'app-state-form-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './state-form-modal.html',
  styleUrl: './state-form-modal.scss',
})
export class StateFormModal implements OnChanges {
  @Input() open = false;
  @Input() title = '';
  @Input() model: StateFormValue = createBlankStateForm();
  @Input() isEditMode = false;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<StateFormValue>();

  formValue: StateFormValue = createBlankStateForm();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model']) {
      this.formValue = { ...this.model };
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.formValue);
  }
}
