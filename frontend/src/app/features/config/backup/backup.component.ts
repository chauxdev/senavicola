import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackupApiService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';

interface BackupFile {
  filename: string;
  size: number;
  createdAt: Date;
}

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backup-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-database"></i></div>
          <div>
            <h2>Backup y Restauración</h2>
            <p>Gestionar copias de seguridad de la base de datos</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="backup-actions">
        <button class="btn-green" (click)="createBackup()" [disabled]="creating()">
          <i class="fas" [class.fa-download]="!creating()" [class.fa-spinner]="creating()" [class.fa-spin]="creating()"></i>
          {{ creating() ? 'Creando backup...' : 'Crear Backup' }}
        </button>
      </div>

      <!-- Backups list -->
      <div class="table-container">
        <div class="table-header">
          <h3><i class="fas fa-history"></i> Historial de Backups</h3>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (backups().length === 0) {
          <div class="empty-state">
            <i class="fas fa-database"></i>
            <h3>No hay backups disponibles</h3>
            <p>Crea un backup usando el botón de arriba</p>
          </div>
        } @else {
          <div class="tabla_contenedor" style="padding: 2rem;">
            <table class="tabla" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; border-bottom: 2px solid #e0e0e0; background: #f5f5f5; width: 60px;">#</th>
                  <th style="padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; border-bottom: 2px solid #e0e0e0; background: #f5f5f5;">Archivo</th>
                  <th style="padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; border-bottom: 2px solid #e0e0e0; background: #f5f5f5;">Tamaño</th>
                  <th style="padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; border-bottom: 2px solid #e0e0e0; background: #f5f5f5;">Fecha</th>
                  <th style="padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; border-bottom: 2px solid #e0e0e0; background: #f5f5f5;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (backup of backups(); track backup.filename; let idx = $index) {
                  <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 1.5rem; font-size: 1.4rem;"><strong>{{ idx + 1 }}</strong></td>
                    <td style="padding: 1.5rem; font-size: 1.4rem;">
                      <i class="fas fa-file-alt" style="color: var(--primary-green); margin-right: 0.5rem;"></i>
                      {{ backup.filename }}
                    </td>
                    <td style="padding: 1.5rem; font-size: 1.4rem;">{{ formatSize(backup.size) }}</td>
                    <td style="padding: 1.5rem; font-size: 1.4rem;">{{ backup.createdAt | date:'short' }}</td>
                    <td style="padding: 1.5rem;">
                      <button class="btn-icon edit" title="Restaurar" (click)="confirmRestore(backup)" [disabled]="restoring()">
                        <i class="fas fa-undo"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
 
      <!-- Restore Confirmation Modal -->
      @if (showRestoreModal()) {
        <div class="modal-overlay" (click)="showRestoreModal.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3><i class="fas fa-exclamation-triangle text-danger"></i> Confirmar Restauración</h3>
              <button class="btn-close" (click)="showRestoreModal.set(false)"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div style="text-align: center; padding: 2rem 0;">
                <i class="fas fa-exclamation-triangle" style="font-size: 5rem; color: var(--danger); margin-bottom: 1.5rem; display: block;"></i>
                <h3 style="font-size: 1.8rem; margin-bottom: 1rem;">¿Estás seguro?</h3>
                <p style="font-size: 1.4rem; color: var(--gray-dark);">Esta acción restaurará la base de datos al estado del backup seleccionado. Los datos actuales podrían perderse.</p>
                <p style="font-size: 1.3rem; color: var(--text-dark); margin-top: 1rem; font-weight: 600;">
                  Archivo: {{ selectedBackup()?.filename }}
                </p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-outline" (click)="showRestoreModal.set(false)">Cancelar</button>
              <button class="btn-danger" (click)="executeRestore()" [disabled]="restoring()">
                <i class="fas" [class.fa-undo]="!restoring()" [class.fa-spinner]="restoring()" [class.fa-spin]="restoring()"></i>
                {{ restoring() ? 'Restaurando...' : 'Restaurar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .backup-actions { margin-bottom: 2.5rem; }
  `],
})
export class BackupComponent implements OnInit {
  private backupService = inject(BackupApiService);
  private toast = inject(ToastService);

  backups = signal<BackupFile[]>([]);
  loading = signal(true);
  creating = signal(false);
  restoring = signal(false);
  showRestoreModal = signal(false);
  selectedBackup = signal<BackupFile | null>(null);

  ngOnInit(): void {
    this.loadBackups();
  }

  loadBackups(): void {
    this.loading.set(true);
    this.backupService.listBackups().subscribe({
      next: (data) => {
        this.backups.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.backups.set([]);
        this.loading.set(false);
      },
    });
  }

  createBackup(): void {
    this.creating.set(true);
    this.backupService.createBackup().subscribe({
      next: (res) => {
        this.toast.success('Backup creado exitosamente');
        this.loadBackups();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${msg}` : 'Error al crear backup');
      },
      complete: () => this.creating.set(false),
    });
  }

  confirmRestore(backup: BackupFile): void {
    this.selectedBackup.set(backup);
    this.showRestoreModal.set(true);
  }

  executeRestore(): void {
    const backup = this.selectedBackup();
    if (!backup) return;
    
    this.restoring.set(true);
    this.backupService.restoreBackup(backup.filename).subscribe({
      next: () => {
        this.toast.success('Backup restaurado exitosamente');
        this.showRestoreModal.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${msg}` : 'Error al restaurar backup');
      },
      complete: () => this.restoring.set(false),
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
