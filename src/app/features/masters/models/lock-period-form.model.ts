export interface LockPeriodFormValue {
  period: string;
}

export function createBlankLockPeriodForm(): LockPeriodFormValue {
  return { period: '' };
}
