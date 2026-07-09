import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface ZipLookupResult {
  city: string;
  state: string;
}

interface ZippopotamPlace {
  'place name': string;
  'state abbreviation': string;
}

interface ZippopotamResponse {
  places: ZippopotamPlace[];
}

/** Looks up city/state for a US zip code via the free Zippopotam.us API. */
@Injectable({ providedIn: 'root' })
export class ZipLookupService {
  private http = inject(HttpClient);

  lookup(zip: string | null | undefined): Observable<ZipLookupResult | null> {
    const cleaned = (zip ?? '').trim();
    if (!/^\d{5}$/.test(cleaned)) return of(null);

    return this.http.get<ZippopotamResponse>(`https://api.zippopotam.us/us/${cleaned}`).pipe(
      map(res => {
        const place = res.places?.[0];
        if (!place) return null;
        return { city: place['place name'], state: place['state abbreviation'] };
      }),
      catchError(() => of(null)),
    );
  }
}
