import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/**
 * Creates a debounced search stream.
 * Call subject$.next(value) from the template handler.
 * Subscribe to stream$ in ngOnInit to react to settled input.
 * Call subject$.complete() in ngOnDestroy.
 */
export function createDebouncedSearch(delayMs = 300) {
  const subject$ = new Subject<string>();
  const stream$ = subject$.pipe(
    debounceTime(delayMs),
    distinctUntilChanged()
  );
  return { subject$, stream$ };
}
