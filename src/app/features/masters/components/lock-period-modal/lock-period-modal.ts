import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lock-period-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './lock-period-modal.html',
  styleUrl: './lock-period-modal.scss',
})
export class LockPeriodModal implements OnChanges {
  @Input() open = false;
  @Input() period = '';
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  periodValue = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['period']) {
      this.periodValue = this.period;
    }
  }

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    this.save.emit(this.periodValue);
  }
}
