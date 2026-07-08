import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-activity-header',
  standalone: true,
  templateUrl: './activity-header.html',
  styleUrl: './activity-header.scss',
})
export class ActivityHeaderComponent {
  @Input() canExport = false;
  @Output() export = new EventEmitter<void>();
}
