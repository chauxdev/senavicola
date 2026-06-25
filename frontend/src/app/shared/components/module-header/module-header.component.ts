import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-module-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="module-header">
      <div class="module-header-left">
        <div class="module-icon">
          <i class="fas" [ngClass]="icon"></i>
        </div>
        <div>
          <h2>{{ title }}</h2>
          <p>{{ description }}</p>
        </div>
      </div>
      <div class="module-header-right">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class ModuleHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input({ required: true }) icon!: string; // e.g. 'fa-dove', 'fa-egg', 'fa-box'
}
