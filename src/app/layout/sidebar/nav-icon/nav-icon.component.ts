import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  imports: [],
  templateUrl: './nav-icon.component.html',
})
export class NavIconComponent {
  @Input() icon: string | null = null;
  @Input() svgClass = 'sub-nav-icon';
  @Input() strokeWidth = '2';
}
