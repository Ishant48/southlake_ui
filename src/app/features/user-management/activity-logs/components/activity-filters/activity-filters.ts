import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivityLogsFilter } from '../../models/activity-log.model';
import { Module } from '../../../models/permission.model';

@Component({
  selector: 'app-activity-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './activity-filters.html',
  styleUrl: './activity-filters.scss',
})
export class ActivityFiltersComponent {
  @Input() filter!: ActivityLogsFilter;
  @Input() modules: Module[] = [];
  @Output() filterChange = new EventEmitter<void>();

  onFilterChange() {
    this.filterChange.emit();
  }

  resetFilters() {
    this.filter.search = '';
    this.filter.action = '';
    this.filter.module_id = '';
    this.filter.date_from = '';
    this.filter.date_to = '';
    this.filterChange.emit();
  }
}
