import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export interface DebouncedSearch<T> {
  value$: Observable<T>;
  next: (value: T) => void;
}

export function createDebouncedSearch<T = string>(debounceMs = 300): DebouncedSearch<T> {
  const subject = new Subject<T>();
  return {
    value$: subject.pipe(debounceTime(debounceMs), distinctUntilChanged()),
    next: value => subject.next(value),
  };
}
