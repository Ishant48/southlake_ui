import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentType } from '../../models/master.model';

export interface DrawerDocument {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  document_type?: string;
}

@Component({
  selector: 'app-document-drawer',
  imports: [CommonModule, FormsModule],
  templateUrl: './document-drawer.html',
  styleUrl: './document-drawer.scss',
})
export class DocumentDrawer {
  @Input() open = false;
  @Input() subtitle = '';
  @Input() documentsList: DrawerDocument[] = [];
  @Input() documentTypesOptions: DocumentType[] = [];
  @Input() uploadingDoc = false;

  @Output() closed = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<{ file: File; documentType: string }>();
  @Output() download = new EventEmitter<DrawerDocument>();
  @Output() delete = new EventEmitter<DrawerDocument>();

  selectedDocType = '';

  close(): void {
    this.closed.emit();
  }

  docTypeLabel(doc: DrawerDocument): string | undefined {
    return doc.document_type;
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.selectedDocType) return;
    this.fileSelected.emit({ file, documentType: this.selectedDocType });
    input.value = '';
  }
}
