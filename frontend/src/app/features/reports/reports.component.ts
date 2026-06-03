import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportsService } from '../../core/services/api.services';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Report } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="reports-page">
      <!-- Header Secundario -->
      <div class="header_modulo">
        <div class="header_modulo_izq">
          <i class="fas fa-file-alt icono_modulo"></i>
          <div>
            <h2 class="titulo_modulo">Reportes</h2>
            <p class="subtitulo_modulo">Genera y exporta reportes del sistema en PDF o Excels y materiales que usa la granja.</p>
          </div>
        </div>
      </div>

      <!-- Grid de Cards de Reportes -->
      <div class="reportes_grid">
        <!-- Card: Reporte de Gallinas -->
        <div class="reporte_card" (click)="abrirModalReporte('gallinas')">
          <div class="reporte_icono">
            <i class="fas fa-dove"></i>
          </div>
          <h3 class="reporte_titulo">Reporte de Gallinas</h3>
          <p class="reporte_descripcion">Galpones, lotes y asignaciones</p>
        </div>

        <!-- Card: Reporte de Huevos -->
        <div class="reporte_card" (click)="abrirModalReporte('huevos')">
          <div class="reporte_icono">
            <i class="fas fa-egg"></i>
          </div>
          <h3 class="reporte_titulo">Reporte de Huevos</h3>
          <p class="reporte_descripcion">Inventario, ventas y dañados</p>
        </div>

        <!-- Card: Reporte de Insumos -->
        <div class="reporte_card" (click)="abrirModalReporte('insumos')">
          <div class="reporte_icono">
            <i class="fas fa-box"></i>
          </div>
          <h3 class="reporte_titulo">Reporte de Insumos</h3>
          <p class="reporte_descripcion">Inventario y movimientos</p>
        </div>

        <!-- Card: Reporte de Producción -->
        <div class="reporte_card" (click)="abrirModalReporte('produccion')">
          <div class="reporte_icono">
            <i class="fas fa-chart-line"></i>
          </div>
          <h3 class="reporte_titulo">Reporte de Producción</h3>
          <p class="reporte_descripcion">Producción por galpón</p>
        </div>

        <!-- Card: Historial General -->
        <div class="reporte_card" (click)="abrirModalReporte('historial')">
          <div class="reporte_icono">
            <i class="fas fa-history"></i>
          </div>
          <h3 class="reporte_titulo">Historial General</h3>
          <p class="reporte_descripcion">Todas las operaciones</p>
        </div>
      </div>
    </div>

    <!-- Modales Generales de Reportes -->
    @if (showModal()) {
      <div class="modal activo" (click)="showModal.set(false)">
        <div class="modal_contenido modal_reporte" (click)="$event.stopPropagation()">
          <div class="modal_header">
            <div class="modal_header_icon">
              <i class="fas" [ngClass]="getModalIcon()"></i>
            </div>
            <h3 class="modal_titulo">Reporte de {{ getModalTitle() }}</h3>
          </div>
          <div class="modal_body_reporte">
            <div class="preview_info">
              <p><strong>Fecha de Generación:</strong> <span>{{ currentDate | date:'short' }}</span></p>
              <p><strong>Generado por:</strong> <span>{{ userName() }}</span></p>
            </div>
            
            <div class="preview_tabla">
              <h4>Vista Previa - {{ getModalTitle() }}</h4>
              <div class="tabla_preview">
                @if (loading()) {
                  <div style="text-align:center; padding:2rem"><span class="spinner-sm"></span> Cargando...</div>
                } @else {
                  <p style="text-align:center; padding:2rem; color:#666">
                    <i class="fas fa-info-circle"></i> Los datos de la vista previa del reporte se generarán aquí.
                  </p>
                }
              </div>
            </div>

            <div class="modal_botones_reporte">
              <button class="btn_descargar_completo" (click)="generateReport()" [disabled]="saving()">
                <i class="fas fa-download"></i> Guardar y Generar PDF
              </button>
            </div>

            <div class="modal_botones">
              <button type="button" class="btn_cerrar" (click)="showModal.set(false)">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Header Secundario */
    .header_modulo { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; padding: 2rem; background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header_modulo_izq { display: flex; align-items: center; gap: 1.5rem; }
    .icono_modulo { font-size: 4rem; color: var(--primary-green); }
    .titulo_modulo { font-size: 2.4rem; font-weight: 700; color: #333; margin-bottom: 0.5rem; }
    .subtitulo_modulo { font-size: 1.4rem; color: #666; font-weight: 400; }

    /* Grid de Reportes */
    .reportes_grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2.5rem; margin-bottom: 3rem; }
    .reporte_card { background: white; border-radius: 15px; padding: 3rem 2rem; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; border: 1px solid #f0f0f0; }
    .reporte_card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); border-color: var(--primary-green); }
    .reporte_icono { width: 70px; height: 70px; border-radius: 50%; background: rgba(57,169,0,0.1); color: var(--primary-green); display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 2rem; transition: all 0.3s ease; }
    .reporte_card:hover .reporte_icono { background: var(--primary-green); color: white; transform: scale(1.1); }
    .reporte_titulo { font-size: 1.8rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .reporte_descripcion { font-size: 1.3rem; color: #666; line-height: 1.5; }

    /* Modal Reporte */
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal_contenido { background: white; border-radius: 15px; width: 90%; max-width: 600px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); animation: modalSlideIn 0.3s ease; }
    @keyframes modalSlideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal_reporte { max-width: 800px; }
    .modal_header { background: var(--primary-green); color: white; padding: 2rem; border-radius: 15px 15px 0 0; display: flex; align-items: center; gap: 1.5rem; }
    .modal_header_icon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; }
    .modal_titulo { font-size: 2rem; font-weight: 700; }
    
    .modal_body_reporte { padding: 3rem; }
    .preview_info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; background: #f8f9fa; padding: 2rem; border-radius: 10px; margin-bottom: 2.5rem; }
    .preview_info p { font-size: 1.4rem; color: #333; }
    .preview_info strong { color: var(--primary-green); font-weight: 600; margin-right: 0.5rem; }
    
    .preview_tabla { margin-bottom: 3rem; }
    .preview_tabla h4 { font-size: 1.6rem; color: #333; margin-bottom: 1.5rem; font-weight: 600; }
    .tabla_preview { background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; min-height: 150px; }
    
    .modal_botones_reporte { display: flex; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .btn_descargar_completo { flex: 1; min-width: 200px; padding: 1.5rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 1rem; transition: all 0.3s ease; }
    .btn_descargar_completo:hover { background: #2d8600; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .btn_descargar_completo:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
    
    .modal_botones { display: flex; justify-content: flex-end; padding-top: 2rem; border-top: 1px solid #e0e0e0; }
    .btn_cerrar { padding: 1.2rem 3rem; background: #e0e0e0; color: #333; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
    .btn_cerrar:hover { background: #bdbdbd; }
  `],
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal(true);
  reports = signal<Report[]>([]);
  showModal = signal(false);
  saving = signal(false);
  selectedType = signal<string>('');
  currentDate = new Date();

  ngOnInit(): void { this.loadReports(); }

  userName(): string {
    const profile = this.authService.currentUser();
    return profile?.nombre ? profile.nombre : 'Usuario';
  }

  private loadReports(): void {
    this.reportsService.getAll().subscribe({
      next: (data) => { this.reports.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrirModalReporte(type: string): void {
    this.selectedType.set(type);
    this.showModal.set(true);
  }

  getModalIcon(): string {
    const type = this.selectedType();
    if (type === 'gallinas') return 'fa-dove';
    if (type === 'huevos') return 'fa-egg';
    if (type === 'insumos') return 'fa-box';
    if (type === 'produccion') return 'fa-chart-line';
    if (type === 'historial') return 'fa-history';
    return 'fa-file-alt';
  }

  getModalTitle(): string {
    const type = this.selectedType();
    if (type === 'gallinas') return 'Gallinas';
    if (type === 'huevos') return 'Huevos';
    if (type === 'insumos') return 'Insumos';
    if (type === 'produccion') return 'Producción';
    if (type === 'historial') return 'Historial General';
    return 'General';
  }

  generateReport(): void {
    this.saving.set(true);

    // Build data matching CreateReportDto
    const profile = this.authService.currentUser();
    const data = {
      tipo_reporte: this.selectedType(),
      id_usuario: profile?.id_usuario ?? '',
    };

    this.reportsService.create(data).subscribe({
      next: () => {
        this.toast.success('Reporte guardado exitosamente');
        this.showModal.set(false);
        this.loadReports();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar el reporte en la base de datos');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }
}
