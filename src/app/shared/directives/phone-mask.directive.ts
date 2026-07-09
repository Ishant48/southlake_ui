import { Directive, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatPhoneNumber } from '../utils/phone-format.util';

/** Masks a text input to US phone format as the user types: (999) 345-9393 */
@Directive({
  selector: '[appPhoneMask]',
})
export class PhoneMaskDirective {
  private ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;
    this.ngControl?.control?.setValue(formatted, { emitEvent: false });
  }
}
