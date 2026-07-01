import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatPaginatorModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  // Core pagination state — same API as before
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 20;
  // Kept for template API compatibility; MatPaginator manages its own display
  @Input() windowSize = 2;
  @Input() showAllPages = false;
  @Output() pageChange = new EventEmitter<number>();

  /** MatPaginator uses 0-based pageIndex; our API uses 1-based currentPage. */
  get pageIndex(): number {
    return Math.max(0, this.currentPage - 1);
  }

  /** Guards against a zero pageSize reaching MatPaginator. */
  get effectivePageSize(): number {
    return this.pageSize > 0 ? this.pageSize : 20;
  }

  /** Converts MatPaginator's 0-based pageIndex back to our 1-based page number. */
  onPage(event: PageEvent): void {
    this.pageChange.emit(event.pageIndex + 1);
  }
}
