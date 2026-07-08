import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartOfAccountDocument } from '../../../../core/models/chart-of-account.model';
import { DocumentType } from '../../../masters/models/master.model';

@Component({
  selector: 'app-documents-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-modal.html',
  styleUrl: './documents-modal.scss',
})
export class DocumentsModal {
  @Input() open = false;
  @Input() subtitle = '';
  @Input() documents: ChartOfAccountDocument[] = [];
  @Input() documentTypesOptions: DocumentType[] = [];
  @Input() uploadingDoc = false;

  selectedDocType = '';

  @Output() closed = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<{ file: File; documentType: string }>();
  @Output() download = new EventEmitter<ChartOfAccountDocument>();
  @Output() delete = new EventEmitter<ChartOfAccountDocument>();

  close(): void {
    this.closed.emit();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedDocType) return;
    this.fileSelected.emit({ file, documentType: this.selectedDocType });
    input.value = '';
  }
}
