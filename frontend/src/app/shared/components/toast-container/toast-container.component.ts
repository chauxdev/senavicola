import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast {{ toast.type }}" (click)="toastService.remove(toast.id)">
          <i class="fas {{ iconMap[toast.type] }}"></i>
          <span>{{ toast.message }}</span>
          <button class="btn-close-toast"><i class="fas fa-times"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `],
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
  iconMap: Record<string, string> = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };
}
