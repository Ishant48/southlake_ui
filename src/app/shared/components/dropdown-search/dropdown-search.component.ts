import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dropdown-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dropdown-search.component.html',
  styleUrl: './dropdown-search.component.scss',
})
export class DropdownSearchComponent<T extends object = Record<string, unknown>>
  implements OnInit, OnChanges, OnDestroy
{
  @Input() items: T[] = [];
  @Input() isMultiSelect: boolean = false;
  @Input() bindValue: string = 'id';
  @Input() placeholder: string = 'Select option';
  @Input() itemLabelFn: (item: T) => string = item => this.readField(item, 'name') ?? '';
  @Input() disabled: boolean = false;

  // Two-way bindings
  @Input() selectedValue: unknown = null; // For single select
  @Output() selectedValueChange = new EventEmitter<unknown>();

  @Input() selectedValues: { [key: string]: boolean } = {}; // For multi select
  @Output() selectedValuesChange = new EventEmitter<{ [key: string]: boolean }>();

  isOpen = false;
  searchText = '';
  filteredItems: T[] = [];
  panelStyle: { top: string; left: string; width: string } = {
    top: '0px',
    left: '0px',
    width: '0px',
  };

  // Scroll events don't bubble, so a scrollable ancestor (e.g. a tall modal body with
  // overflow-y: auto) never reaches a bubble-phase listener on document. Capture-phase
  // catches it regardless of where in the DOM the scroll originated.
  private readonly onScrollCapture = (event: Event): void => {
    if (!this.isOpen) return;
    const panel = this.elementRef.nativeElement.querySelector('.dropdown-search-panel');
    if (panel?.contains(event.target as Node)) return;
    this.isOpen = false;
  };

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.filterItems();
    document.addEventListener('scroll', this.onScrollCapture, true);
  }

  ngOnDestroy() {
    document.removeEventListener('scroll', this.onScrollCapture, true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items'] || changes['selectedValue'] || changes['selectedValues']) {
      this.filterItems();
    }
  }

  // Panel is position:fixed and positioned from the trigger's viewport rect so it
  // isn't clipped by a scrollable ancestor.
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) this.isOpen = false;
  }

  private updatePanelPosition(): void {
    const trigger = this.elementRef.nativeElement.querySelector('.dropdown-search-trigger');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    this.panelStyle = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    };
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchText = '';
      this.filterItems();
      this.updatePanelPosition();
      // Focus the search input after small timeout
      setTimeout(() => {
        const input = this.elementRef.nativeElement.querySelector('.dropdown-search-input');
        if (input) input.focus();
      }, 50);
    }
  }

  filterItems() {
    if (!this.searchText.trim()) {
      this.filteredItems = [...this.items];
    } else {
      const q = this.searchText.toLowerCase().trim();
      this.filteredItems = this.items.filter(item => {
        const label = this.itemLabelFn(item).toLowerCase();
        return label.includes(q);
      });
    }
  }

  getDisplayText(): string {
    if (this.isMultiSelect) {
      const selectedKeys = Object.keys(this.selectedValues).filter(k => this.selectedValues[k]);
      if (selectedKeys.length === 0) {
        return this.placeholder;
      }
      // Find selected items
      const selectedLabels = this.items
        .filter(item => this.selectedValues[this.readValue(item) as string])
        .map(item => this.itemLabelFn(item));

      if (selectedLabels.length <= 2) {
        return selectedLabels.join(', ');
      }
      return `${selectedLabels.length} selected`;
    } else {
      if (
        this.selectedValue === null ||
        this.selectedValue === undefined ||
        this.selectedValue === ''
      ) {
        return this.placeholder;
      }
      const matched = this.items.find(item => this.readValue(item) === this.selectedValue);
      return matched ? this.itemLabelFn(matched) : this.placeholder;
    }
  }

  selectSingle(item: T) {
    this.selectedValue = this.readValue(item);
    this.selectedValueChange.emit(this.selectedValue);
    this.isOpen = false;
  }

  toggleMulti(item: T) {
    const val = this.readValue(item) as string;
    const newSelected = { ...this.selectedValues };
    newSelected[val] = !newSelected[val];
    this.selectedValues = newSelected;
    this.selectedValuesChange.emit(this.selectedValues);
  }

  isSelected(item: T): boolean {
    const val = this.readValue(item) as string;
    if (this.isMultiSelect) {
      return !!this.selectedValues[val];
    } else {
      return this.selectedValue === val;
    }
  }

  selectAll() {
    const newSelected = { ...this.selectedValues };
    this.filteredItems.forEach(item => {
      newSelected[this.readValue(item) as string] = true;
    });
    this.selectedValues = newSelected;
    this.selectedValuesChange.emit(this.selectedValues);
  }

  deselectAll() {
    const newSelected = { ...this.selectedValues };
    this.filteredItems.forEach(item => {
      newSelected[this.readValue(item) as string] = false;
    });
    this.selectedValues = newSelected;
    this.selectedValuesChange.emit(this.selectedValues);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  private readValue(item: T): unknown {
    return this.readField(item, this.bindValue);
  }

  private readField(item: T, key: string): string | undefined {
    return (item as Record<string, unknown>)[key] as string | undefined;
  }
}
