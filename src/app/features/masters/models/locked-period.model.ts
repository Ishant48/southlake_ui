export interface LockedPeriod {
  period: string;
  isLocked: boolean;
  user?: { name?: string };
  lockedAt?: string;
}
