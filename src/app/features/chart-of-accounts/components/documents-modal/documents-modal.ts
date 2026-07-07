import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartOfAccountDocument } from '../../../../core/models/chart-of-account.model';

@Component({
  selector: 'app-documents-modal',
  imports: [CommonModule],
  templateUrl: './documents-modal.html',
  styleUrl: './documents-modal.scss',
})
export class DocumentsModal {
  @Input() open = false;
  @Input() subtitle = '';
  @Input() documents: ChartOfAccountDocument[] = [];
  @Input() uploadingDoc = false;

  @Output() closed = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<Event>();
  @Output() download = new EventEmitter<ChartOfAccountDocument>();
  @Output() delete = new EventEmitter<ChartOfAccountDocument>();

  close(): void {
    this.closed.emit();
  }

  onFileInputChange(event: Event): void {
    this.fileSelected.emit(event);
  }
}
