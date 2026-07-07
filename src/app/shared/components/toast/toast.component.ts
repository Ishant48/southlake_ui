import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ToastService, ToastType } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  protected readonly ToastType = ToastType;

  private toastService = inject(ToastService);
  toasts$ = this.toastService.toasts$;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
