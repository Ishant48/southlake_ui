import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum ToastType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  show(type: ToastType, message: string, title?: string): void {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type, message, title };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string, title?: string): void {
    this.show(ToastType.Success, message, title);
  }
  error(message: string, title?: string): void {
    this.show(ToastType.Error, message, title);
  }
  warning(message: string, title?: string): void {
    this.show(ToastType.Warning, message, title);
  }
  info(message: string, title?: string): void {
    this.show(ToastType.Info, message, title);
  }

  dismiss(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }
}
