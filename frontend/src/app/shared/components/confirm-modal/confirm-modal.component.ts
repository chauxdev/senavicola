import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (service.visible()) {
      <div class="modal-overlay" (click)="service.handleCancel()">
        <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle text-danger"></i> {{ service.title() }}</h3>
            <button class="btn-close" (click)="service.handleCancel()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <p>{{ service.message() }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="service.handleCancel()">{{ service.btnCancelText() }}</button>
            <button class="btn-danger" (click)="service.handleConfirm()">{{ service.btnConfirmText() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(16, 24, 40, 0.72); display: flex; align-items: center; justify-content: center; z-index: 2100; }
    .modal-card { width: min(100%, 42rem); border-radius: var(--border-radius-lg); background: white; box-shadow: var(--shadow-lg); overflow: hidden; }
    .modal-sm { max-width: 38rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.8rem 2.2rem; background: var(--gray-light); }
    .modal-header h3 { font-size: 1.7rem; display: flex; align-items: center; gap: 1rem; margin:0; }
    .text-danger { color: var(--danger, #f44336); }
    .modal-body { padding: 2rem 2.2rem; font-size: 1.4rem; line-height: 1.8; color: var(--text-dark, #333); }
    .modal-footer { padding: 1.6rem 2.2rem; display: flex; justify-content: flex-end; gap: 1rem; background: var(--gray-light); }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
  `],
})
export class ConfirmModalComponent {
  service = inject(ConfirmService);
}
