import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TreatyQuickAddState {
  pendingMgaId: string | null = null;
}
