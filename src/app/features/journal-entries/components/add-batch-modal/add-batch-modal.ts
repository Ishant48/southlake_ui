import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-batch-modal',
  imports: [CommonModule],
  templateUrl: './add-batch-modal.html',
  styleUrl: './add-batch-modal.scss',
})
export class AddBatchModal {
  @Input() open = false;
  @Input() period = '';
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.add.emit();
  }
}
