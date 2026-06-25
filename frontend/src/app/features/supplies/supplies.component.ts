import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SuppliesService, SupplyCategoriesService, MeasurementUnitsService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Supply, SupplyCategory, MeasurementUnit } from '../../core/models';
import { ModuleHeaderComponent } from '../../shared/components/module-header/module-header.component';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';

@Component({
  selector: 'app-supplies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent, ModuleHeaderComponent],
  template: `
    <div class="supplies-page">
      <!-- Header del Módulo -->
      <app-module-header 
        title="Gestión de Insumos" 
        description="Registra los alimentos y materiales que usa la granja." 
        icon="fa-box">
        <button class="btn-green" (click)="openModal()">
          <i class="fas fa-plus"></i> Registrar Insumo
        </button>
      </app-module-header>

      <!-- Cards de Estadísticas -->
      <div class="contenedor_cards">
        <div class="card_stat">
          <div class="card_icono card_icono_verde"><i class="fas fa-seedling"></i></div>
          <div class="card_info">
            <p class="card_label">Alimento Total</p>
            <h3 class="card_valor">{{ totalAlimento() }} kg</h3>
          </div>
        </div>
        <div class="card_stat">
          <div class="card_icono card_icono_azul"><i class="fas fa-tools"></i></div>
          <div class="card_info">
            <p class="card_label">Herramientas</p>
            <h3 class="card_valor">{{ totalHerramientas() }}</h3>
          </div>
        </div>
        <div class="card_stat">
          <div class="card_icono card_icono_morado"><i class="fas fa-capsules"></i></div>
          <div class="card_info">
            <p class="card_label">Medicamentos</p>
            <h3 class="card_valor">{{ totalMedicamentos() }} kg</h3>
          </div>
        </div>
        <div class="card_stat">
          <div class="card_icono card_icono_rojo"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="card_info">
            <p class="card_label">Total Insumos</p>
            <h3 class="card_valor">{{ supplies().length }}</h3>
          </div>
        </div>
      </div>

      <!-- Tabla de Insumos -->
      <div class="contenedor_tabla">
        <div class="tabla_header">
          <h3 class="tabla_titulo">Inventario de Insumos</h3>
          <div class="controles_tabla">
            <div class="busqueda_contenedor">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Buscar por nombre..." class="input_busqueda" [(ngModel)]="searchQuery" (input)="onSearchInput()" />
            </div>
            <select class="select_filtro" [(ngModel)]="filterCategory" (change)="filterSupplies()">
              <option value="todos">Todas las categorías</option>
              @for (cat of categories(); track cat.id_categoria_insumo) {
                <option [value]="cat.nombre_categoria">{{ cat.nombre_categoria }}</option>
              }
            </select>
          </div>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-box"></i>
            <h3>No hay insumos registrados</h3>
            <p>Registra un insumo haciendo clic en "Registrar Insumo"</p>
          </div>
        } @else {
          <div class="tabla_contenedor">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Categoría</th><th>Nombre</th><th>Cantidad</th><th>Unidad</th>
                  <th>Fecha Ingreso</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (supply of filtered(); track supply.id_insumo) {
                  <tr>
                    <td><span class="badge_estado disponible">{{ supply.categoria?.nombre_categoria || '—' }}</span></td>
                    <td><strong>{{ supply.nombre }}</strong></td>
                    <td>{{ supply.cantidad }}</td>
                    <td>{{ supply.unidadMedida?.abreviatura || supply.unidadMedida?.nombre || '—' }}</td>
                    <td>{{ supply.fecha || '—' }}</td>
                    <td class="acciones_cell">
                      <button class="btn_accion btn_editar" (click)="editSupply(supply)"><i class="fas fa-edit"></i></button>
                      <button class="btn_accion btn_eliminar_tabla" (click)="deleteSupply(supply.id_insumo)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination 
            [currentPage]="currentPage" 
            [totalPages]="totalPages" 
            [totalItems]="totalItems"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </div>
    </div>

    <!-- Modal Registrar/Editar Insumo -->
    @if (showModal()) {
      <div class="modal activo" (click)="closeModal()">
        <div class="modal_contenido" (click)="$event.stopPropagation()">
          <div class="modal_header">
            <div class="modal_header_icon"><i class="fas fa-box"></i></div>
            <h3 class="modal_titulo">{{ editing() ? 'Editar Insumo' : 'Registrar Insumo' }}</h3>
          </div>
          <form [formGroup]="supplyForm" class="modal_form" (ngSubmit)="save()">
            <div class="form_group">
              <label>Categoría <span class="requerido">*</span></label>
              <select formControlName="id_categoria">
                <option value="">Seleccione una categoría</option>
                @for (cat of categories(); track cat.id_categoria_insumo) {
                  <option [value]="cat.id_categoria_insumo">{{ cat.nombre_categoria }}</option>
                }
              </select>
            </div>
            <div class="form_group">
              <label>Nombre del Insumo <span class="requerido">*</span></label>
              <input type="text" formControlName="nombre" placeholder="Ej: Maíz molido" />
            </div>
            <div class="form_group">
              <label>Cantidad <span class="requerido">*</span></label>
              <input type="number" formControlName="cantidad" placeholder="Ej: 50" step="0.01" min="0" />
            </div>
            <div class="form_group">
              <label>Unidad de Medida <span class="requerido">*</span></label>
              <select formControlName="id_unidad_medida">
                <option value="">Seleccione unidad</option>
                @for (unit of units(); track unit.id_unidad_medida) {
                  <option [value]="unit.id_unidad_medida">{{ unit.nombre }} ({{ unit.abreviatura }})</option>
                }
              </select>
            </div>
            <div class="form_group">
              <label>Fecha <span class="requerido">*</span></label>
              <input type="date" formControlName="fecha" />
            </div>
            <div class="modal_botones">
              <button type="button" class="btn_cancelar" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn_registrar" [disabled]="saving()">
                @if (saving()) { <span class="spinner_sm"></span> }
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (showConfirmModal()) {
      <div class="modal-overlay" (click)="cancelConfirm()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle" style="color: var(--danger, #e53935);"></i> Confirmar</h3>
            <button class="btn-close" (click)="cancelConfirm()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body" style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--danger, #e53935); margin-bottom: 1.5rem; display: block;"></i>
            <p style="font-size: 1.5rem;">{{ confirmMessage }}</p>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="cancelConfirm()">Cancelar</button>
            <button class="btn-danger" (click)="executeConfirm()"><i class="fas fa-check"></i> Confirmar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Cards */
    .contenedor_cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
    .card_stat { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1.5rem; transition: all 0.3s; }
    .card_stat:hover { transform: translateY(-5px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .card_icono { width: 60px; height: 60px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; color: white; }
    .card_icono_verde { background: #4caf50; }
    .card_icono_azul { background: #2196f3; }
    .card_icono_morado { background: #9c27b0; }
    .card_icono_rojo { background: #f44336; }
    .card_info { flex: 1; }
    .card_label { font-size: 1.4rem; color: #666; margin-bottom: 0.5rem; }
    .card_valor { font-size: 3rem; font-weight: 700; color: #333; }

    /* Tabla */
    .contenedor_tabla { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 2.5rem; }
    .tabla_header { margin-bottom: 2rem; }
    .tabla_titulo { font-size: 2rem; font-weight: 700; color: #333; margin-bottom: 2rem; }
    .controles_tabla { display: flex; justify-content: flex-start; align-items: center; gap: 2rem; }
    .busqueda_contenedor { position: relative; flex: 1; max-width: 400px; }
    .busqueda_contenedor i { position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%); color: #666; font-size: 1.6rem; }
    .input_busqueda { width: 100%; padding: 1.2rem 1.5rem 1.2rem 4.5rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.5rem; transition: all 0.3s; }
    .input_busqueda:focus { outline: none; border-color: var(--primary-green); }
    .select_filtro { padding: 1.2rem 3rem 1.2rem 1.5rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.5rem; background: white; cursor: pointer; }
    .tabla_contenedor { overflow-x: auto; margin-top: 2rem; }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla thead { background: #f5f5f5; }
    .tabla th { padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; color: #333; border-bottom: 2px solid #e0e0e0; }
    .tabla td { padding: 1.5rem; font-size: 1.4rem; color: #333; border-bottom: 1px solid #e0e0e0; }
    .tabla tbody tr { transition: background 0.2s; }
    .tabla tbody tr:hover { background: rgba(57,169,0,0.05); }
    .badge_estado { padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 1.3rem; font-weight: 600; display: inline-block; }
    .badge_estado.disponible { background: #e8f5e9; color: #2e7d32; }
    .acciones_cell { display: flex; gap: 0.5rem; }
    .btn_accion { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-size: 1.3rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_editar { background: #2196f3; color: white; }
    .btn_editar:hover { background: #1976d2; transform: scale(1.05); }
    .btn_eliminar_tabla { background: #f44336; color: white; }
    .btn_eliminar_tabla:hover { background: #d32f2f; transform: scale(1.05); }

    /* Modal */
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal_contenido { background: white; border-radius: 15px; width: 90%; max-width: 500px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); animation: modalSlideIn 0.3s ease; }
    @keyframes modalSlideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal_header { background: var(--primary-green); color: white; padding: 2rem; border-radius: 15px 15px 0 0; display: flex; align-items: center; gap: 1.5rem; }
    .modal_header_icon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; }
    .modal_titulo { font-size: 2rem; font-weight: 700; }
    .modal_form { padding: 2.5rem; }
    .form_group { margin-bottom: 2rem; }
    .form_group label { display: block; font-size: 1.4rem; font-weight: 600; color: #333; margin-bottom: 0.8rem; }
    .requerido { color: #f44336; }
    .form_group input, .form_group select, .form_group textarea { width: 100%; padding: 1.2rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.5rem; font-family: 'Work Sans', sans-serif; transition: all 0.3s; }
    .form_group input:focus, .form_group select:focus { outline: none; border-color: var(--primary-green); }
    .modal_botones { display: flex; gap: 1.5rem; margin-top: 2.5rem; }
    .btn_cancelar { flex: 1; padding: 1.2rem 2rem; background: #e0e0e0; color: #333; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_cancelar:hover { background: #bdbdbd; }
    .btn_registrar { flex: 1; padding: 1.2rem 2rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_registrar:hover { background: #2d8600; }
    .btn_registrar:disabled { opacity: 0.6; cursor: not-allowed; }

    @media (max-width: 1200px) { .contenedor_cards { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .contenedor_cards { grid-template-columns: 1fr; } .controles_tabla { flex-direction: column; align-items: stretch; } .busqueda_contenedor { max-width: 100%; } }
  `],
})
export class SuppliesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private suppliesService = inject(SuppliesService);
  private categoriesService = inject(SupplyCategoriesService);
  private unitsService = inject(MeasurementUnitsService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private refreshService = inject(DashboardRefreshService);

  loading = signal(true);
  supplies = signal<Supply[]>([]);
  filtered = signal<Supply[]>([]);
  categories = signal<SupplyCategory[]>([]);
  units = signal<MeasurementUnit[]>([]);
  searchQuery = '';
  searchSubject = new Subject<string>();
  filterCategory = 'todos';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 10;

  showModal = signal(false);
  editing = signal<Supply | null>(null);
  saving = signal(false);
  totalAlimento = signal(0);
  totalHerramientas = signal(0);
  totalMedicamentos = signal(0);

  showConfirmModal = signal(false);
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  // Form matching CreateSupplyDto: { id_categoria, id_unidad_medida, id_llamar_usuario, nombre, cantidad, fecha }
  supplyForm = this.fb.group({
    nombre: ['', Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0)]],
    fecha: [new Date().toISOString().split('T')[0], Validators.required],
    id_categoria: ['', Validators.required],
    id_unidad_medida: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
    this.categoriesService.getAll().subscribe((c) => this.categories.set(c));
    this.unitsService.getAll().subscribe((u) => this.units.set(u));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.suppliesService.getAllPaginated({ page: this.currentPage, limit: this.limit, search: this.searchQuery }).subscribe({
      next: (res) => {
        this.supplies.set(res.data);
        this.filtered.set(res.data);
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.computeStats(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeStats(data: Supply[]): void {
    let alimento = 0, herramientas = 0, medicamentos = 0;
    data.forEach((s) => {
      const cat = (s.categoria?.nombre_categoria || '').toLowerCase();
      if (cat.includes('alimento')) alimento += s.cantidad || 0;
      else if (cat.includes('herramienta')) herramientas += s.cantidad || 0;
      else if (cat.includes('medicamento')) medicamentos += s.cantidad || 0;
    });
    this.totalAlimento.set(alimento);
    this.totalHerramientas.set(herramientas);
    this.totalMedicamentos.set(medicamentos);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  filterSupplies(): void {
    // Legacy client-side filter
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.supplies().filter((s) => {
      const matchQuery = !q || `${s.nombre} ${s.categoria?.nombre_categoria}`.toLowerCase().includes(q);
      const matchCat = this.filterCategory === 'todos' || s.categoria?.nombre_categoria === this.filterCategory;
      return matchQuery && matchCat;
    }));
  }

  openModal(): void { this.editing.set(null); this.supplyForm.reset({ fecha: new Date().toISOString().split('T')[0] }); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  editSupply(supply: Supply): void {
    this.editing.set(supply);
    this.supplyForm.patchValue({
      nombre: supply.nombre,
      cantidad: supply.cantidad ?? null,
      fecha: supply.fecha ? new Date(supply.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      id_categoria: String(supply.id_categoria || ''),
      id_unidad_medida: String(supply.id_unidad_medida || ''),
    });
    this.showModal.set(true);
  }

  save(): void {
    if (this.supplyForm.invalid) { this.supplyForm.markAllAsTouched(); return; }
    this.saving.set(true);

    const formData = this.supplyForm.value;
    // Build data matching CreateSupplyDto exactly
    const data: Record<string, unknown> = {
      nombre: formData.nombre,
      cantidad: Number(formData.cantidad),
      fecha: formData.fecha,
      id_categoria: Number(formData.id_categoria),
      id_unidad_medida: Number(formData.id_unidad_medida),
      id_llamar_usuario: 1, // Default user
    };

    const editing = this.editing();
    const req = editing
      ? this.suppliesService.update(editing.id_insumo, data as Partial<Supply>)
      : this.suppliesService.create(data as Partial<Supply>);

    req.subscribe({
      next: () => {
        this.toast.success(editing ? 'Insumo actualizado' : 'Insumo registrado exitosamente');
        this.closeModal();
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar el insumo');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  deleteSupply(id: string): void {
    this.requestConfirm('¿Eliminar este insumo?', () => {
      this.suppliesService.delete(id).subscribe({
        next: () => {
          this.toast.success('Insumo eliminado');
          this.loadData();
          this.refreshService.notifyDataChanged();
        },
        error: () => this.toast.error('Error al eliminar el insumo'),
      });
    });
  }

  requestConfirm(message: string, action: () => void): void {
    this.confirmMessage = message;
    this.confirmAction = action;
    this.showConfirmModal.set(true);
  }

  executeConfirm(): void {
    if (this.confirmAction) this.confirmAction();
    this.showConfirmModal.set(false);
  }

  cancelConfirm(): void {
    this.showConfirmModal.set(false);
  }
}
