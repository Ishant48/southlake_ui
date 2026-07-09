import { createDebouncedSearch } from './debounced-search.util';

describe('createDebouncedSearch', () => {
  it('emits only the last value after the debounce window elapses', async () => {
    const debounced = createDebouncedSearch<string>(20);
    const values: string[] = [];
    debounced.value$.subscribe(v => values.push(v));

    debounced.next('j');
    debounced.next('jo');
    debounced.next('john');

    await new Promise(resolve => setTimeout(resolve, 40));

    expect(values).toEqual(['john']);
  });

  it('does not emit consecutive duplicate values', async () => {
    const debounced = createDebouncedSearch<string>(20);
    const values: string[] = [];
    debounced.value$.subscribe(v => values.push(v));

    debounced.next('same');
    await new Promise(resolve => setTimeout(resolve, 40));
    debounced.next('same');
    await new Promise(resolve => setTimeout(resolve, 40));

    expect(values).toEqual(['same']);
  });

  it('defaults to a 300ms debounce window', async () => {
    const debounced = createDebouncedSearch<string>();
    const values: string[] = [];
    debounced.value$.subscribe(v => values.push(v));

    debounced.next('x');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(values).toEqual([]);

    await new Promise(resolve => setTimeout(resolve, 250));
    expect(values).toEqual(['x']);
  });
});
