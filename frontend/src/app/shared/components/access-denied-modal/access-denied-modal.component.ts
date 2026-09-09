import { Component, inject } from '@angular/core';
import { AccessDeniedService } from '../../../core/services/access-denied.service';

@Component({
  selector: 'app-access-denied-modal',
  standalone: true,
  imports: [],
  template: `
    @if (service.visible()) {
      <div class="modal-overlay" (click)="service.close()">
        <div class="modal-card modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-shield-alt"></i> Acceso Denegado</h3>
            <button class="btn-close" (click)="service.close()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <p>{{ service.message() }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-green" (click)="service.close()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(16, 24, 40, 0.72); display: flex; align-items: center; justify-content: center; z-index: 1100; }
    .modal-card { width: min(100%, 42rem); border-radius: var(--border-radius-lg); background: white; box-shadow: var(--shadow-xxl); overflow: hidden; }
    .modal-sm { max-width: 38rem; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.8rem 2.2rem; background: var(--gray-light); }
    .modal-header h3 { font-size: 1.7rem; display: flex; align-items: center; gap: 1rem; margin:0; }
    .modal-body { padding: 2rem 2.2rem; font-size: 1.4rem; line-height: 1.8; }
    .modal-footer { padding: 1.6rem 2.2rem; display: flex; justify-content: flex-end; gap: 1rem; background: var(--gray-very-light); }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
  `],
})
export class AccessDeniedModalComponent {
  service = inject(AccessDeniedService);
}
