import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-notes-modal',
  imports: [],
  templateUrl: './notes-modal.html',
  styleUrl: './notes-modal.scss',
})
export class NotesModal {
  @Input() open = false;
  @Input() title = '';
  @Input() text = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
