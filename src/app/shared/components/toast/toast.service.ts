import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(type: Toast['type'], message: string, title?: string): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, title };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string, title?: string): void { this.show('success', message, title); }
  error(message: string, title?: string): void { this.show('error', message, title); }
  warning(message: string, title?: string): void { this.show('warning', message, title); }
  info(message: string, title?: string): void { this.show('info', message, title); }

  dismiss(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
