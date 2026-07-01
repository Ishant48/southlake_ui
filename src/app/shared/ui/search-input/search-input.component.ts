import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search...';
  @Input() initialValue = '';
  @Input() debounceMs = 300;
  @Output() searched = new EventEmitter<string>();

  protected inputValue = '';
  private readonly subject$ = new Subject<string>();

  ngOnInit(): void {
    this.inputValue = this.initialValue;
    this.subject$.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged()
    ).subscribe(val => this.searched.emit(val));
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.inputValue = val;
    this.subject$.next(val);
  }

  clear(): void {
    this.inputValue = '';
    this.subject$.next('');
  }

  ngOnDestroy(): void {
    this.subject$.complete();
  }
}
