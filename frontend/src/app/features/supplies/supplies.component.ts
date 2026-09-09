import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SuppliesService, SupplyCategoriesService, MeasurementUnitsService, SupplyHistoryService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Supply, SupplyCategory, MeasurementUnit, SupplyHistory } from '../../core/models';
import { ModuleHeaderComponent } from '../../shared/components/module-header/module-header.component';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { PermissionsService } from '../../core/services/permissions.service';

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
        <div class="header-actions">
          <button class="btn-outline" (click)="openHistoryModal()">
            <i class="fas fa-history"></i> Ver Historial
          </button>
          @if (permissions.canWrite()) {
            <button class="btn-green" (click)="openModal()">
              <i class="fas fa-plus"></i> Registrar Insumo
            </button>
          }
        </div>
      </app-module-header>

      <!-- Cards de Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-seedling"></i></div>
          <div class="stat-info">
            <div class="stat-label">Alimento Total</div>
            <div class="stat-value">{{ totalAlimento() }} kg</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-tools"></i></div>
          <div class="stat-info">
            <div class="stat-label">Herramientas</div>
            <div class="stat-value">{{ totalHerramientas() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-capsules"></i></div>
          <div class="stat-info">
            <div class="stat-label">Medicamentos</div>
            <div class="stat-value">{{ totalMedicamentos() }} kg</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fas fa-exclamation-triangle"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Insumos</div>
            <div class="stat-value">{{ totalInsumos() }}</div>
          </div>
        </div>
      </div>

      <!-- Tabla de Insumos -->
      <div class="table-container">
        <div class="table-header">
          <h3>Inventario de Insumos</h3>
          <div class="table-actions">
            <div class="search-bar">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="Buscar por nombre..." [(ngModel)]="searchQuery" (input)="onSearchInput()" />
            </div>
            <select class="select_filtro" [(ngModel)]="filterCategory" (change)="onCategoryFilterChange()">
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
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 60px;">#</th>
                  <th>Tipo de Insumo</th>
                  <th>Nombre</th>
                  <th>Cantidad</th>
                  <th>Unidad de Medida</th>
                  <th>Fecha de Ingreso</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  @if (permissions.canWrite()) {
                    <th style="text-align: right; width: 140px;">Acciones</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (supply of filtered(); track supply.id_insumo; let idx = $index) {
                  <tr>
                    <td><strong>{{ (currentPage - 1) * limit + idx + 1 }}</strong></td>
                    <td><span class="badge info">{{ supply.categoria?.nombre_categoria || '—' }}</span></td>
                    <td><strong>{{ supply.nombre }}</strong></td>
                    <td><strong>{{ supply.cantidad | number:'1.0-0' }}</strong></td>
                    <td>{{ supply.unidadMedida?.abreviatura || supply.unidadMedida?.nombre || '—' }}</td>
                    <td>{{ supply.fecha ? (supply.fecha | date:'dd/MM/yyyy') : '—' }}</td>
                    <td>{{ supply.llamarUsuario?.usuario ? (supply.llamarUsuario.usuario.nombre + ' ' + (supply.llamarUsuario.usuario.apellido || '')) : 'Sistema' }}</td>
                    <td>
                      <span class="badge" [class.danger]="Number(supply.cantidad) <= Number(supply.stockMinimo || 0)" [class.active]="Number(supply.cantidad) > Number(supply.stockMinimo || 0)">
                        {{ Number(supply.cantidad) <= Number(supply.stockMinimo || 0) ? 'Bajo' : 'Normal' }}
                      </span>
                    </td>
                    @if (permissions.canWrite()) {
                      <td class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn-icon view" title="Agregar stock" (click)="openReabastecerModal(supply)"><i class="fas fa-plus"></i></button>
                        <button class="btn-icon edit" title="Editar Insumo" (click)="editSupply(supply)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" title="Eliminar Insumo" (click)="deleteSupply(supply.id_insumo)"><i class="fas fa-trash"></i></button>
                      </td>
                    }
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
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-box"></i> {{ editing() ? 'Editar Insumo' : 'Registrar Insumo' }}</h3>
            <button class="btn-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="supplyForm" (ngSubmit)="save()">
              <div class="form-group">
                <label><i class="fas fa-file-signature"></i> Nombre del Insumo <span style="color: red">*</span></label>
                <input type="text" formControlName="nombre" placeholder="Ej: Maíz molido" [readonly]="permissions.isVisitor() || editing() !== null" [class.input-disabled]="permissions.isVisitor() || editing() !== null" />
              </div>
              
              <div class="form-group">
                <label><i class="fas fa-tags"></i> Tipo de Insumo <span style="color: red">*</span></label>
                <select formControlName="id_categoria" [attr.disabled]="permissions.isVisitor() ? true : null">
                  <option value="">Seleccione una categoría</option>
                  @for (cat of categories(); track cat.id_categoria_insumo) {
                    <option [value]="cat.id_categoria_insumo">{{ cat.nombre_categoria }}</option>
                  }
                </select>
              </div>

              <!-- Fila: Cantidad | Unidad de Medida -->
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-balance-scale"></i> Cantidad <span style="color: red">*</span></label>
                  <input type="number" formControlName="cantidad" placeholder="Ej: 50" step="1" min="0" oninput="this.value = this.value.replace(/[^0-9]/g, '')" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-weight-hanging"></i> Unidad de Medida <span style="color: red">*</span></label>
                  <select formControlName="id_unidad_medida" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="">Seleccione unidad</option>
                    @for (unit of units(); track unit.id_unidad_medida) {
                      <option [value]="unit.id_unidad_medida">{{ unit.nombre }} ({{ unit.abreviatura }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label><i class="fas fa-exclamation-triangle"></i> Stock Mínimo <span style="color: red">*</span></label>
                <input type="number" formControlName="stockMinimo" placeholder="Ej: 10" step="1" min="0" oninput="this.value = this.value.replace(/[^0-9]/g, '')" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>

              <div class="form-group">
                <label><i class="fas fa-calendar-alt"></i> Fecha de ingreso <span style="color: red">*</span></label>
                <input type="date" formControlName="fecha" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>

              <div class="form-group">
                <label><i class="fas fa-truck"></i> Proveedor (Opcional)</label>
                <input type="text" formControlName="proveedor" placeholder="Ej: Proveedor S.A." [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>

              <div class="form-group">
                <label><i class="fas fa-dollar-sign"></i> Precio Unitario</label>
                <input type="number" formControlName="precioUnitario" placeholder="Ej: 1500" step="0.01" min="0" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="closeModal()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button type="submit" class="btn-green" (click)="save()" [disabled]="saving()">
                @if (saving()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
                {{ editing() ? 'Actualizar' : 'Guardar' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Reabastecer Insumo -->
    @if (showReabastecerModal()) {
      <div class="modal-overlay" (click)="closeReabastecerModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-plus-circle"></i> Reabastecer Insumo</h3>
            <button class="btn-close" (click)="closeReabastecerModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="reabastecerForm">
              <div class="form-group">
                <label><i class="fas fa-box"></i> Nombre del Insumo</label>
                <input type="text" [value]="selectedSupply()?.nombre" disabled class="input-disabled" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-balance-scale"></i> Cantidad a agregar <span style="color: red">*</span></label>
                <input type="number" formControlName="cantidad" placeholder="Ej: 20" step="1" min="0" oninput="this.value = this.value.replace(/[^0-9]/g, '')" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment-alt"></i> Motivo <span style="color: red">*</span></label>
                <textarea formControlName="motivo" placeholder="Ej: Compra mensual de insumos..." rows="3" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="closeReabastecerModal()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button type="button" class="btn-green" (click)="submitReabastecer()" [disabled]="reabastecerForm.invalid || submittingReabastecer()">
                @if (submittingReabastecer()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-plus"></i> }
                Reabastecer
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Historial de Movimientos -->
    @if (showHistoryModal()) {
      <div class="modal-overlay" (click)="closeHistoryModal()">
        <div class="modal-card large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-history"></i> Historial de Movimientos</h3>
            <button class="btn-close" (click)="closeHistoryModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="history-controls">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar por insumo..." [(ngModel)]="historySearchQuery" (input)="onHistorySearchInput()" />
              </div>
              <select class="select_filtro" [(ngModel)]="historyType" (change)="onHistoryFilterChange()">
                <option value="todos">Todos los movimientos</option>
                <option value="entrada">Entradas</option>
                <option value="salida">Salidas</option>
                <option value="ajuste">Ajustes</option>
              </select>
            </div>

            @if (historyLoading()) {
              <div class="loading-container"><div class="spinner"></div></div>
            } @else if (historyItems().length === 0) {
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No hay movimientos registrados</h3>
                <p>Los movimientos se registran al crear, reabastecer o editar insumos.</p>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Insumo</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Usuario</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of historyItems(); track item.id_historial_insumo) {
                      <tr>
                        <td>{{ item.fecha | date:'dd/MM/yyyy' }}</td>
                        <td>{{ item.fecha | date:'HH:mm:ss' }}</td>
                        <td><strong>{{ item.insumo?.nombre || '—' }}</strong></td>
                        <td>
                          <span class="badge" [class.active]="item.accion?.nombre === 'ENTRADA'" [class.danger]="item.accion?.nombre === 'SALIDA'" [class.warning]="item.accion?.nombre === 'AJUSTE'">
                            {{ item.accion?.nombre || '—' }}
                          </span>
                        </td>
                        <td>
                          <strong [class.text-green]="item.accion?.nombre === 'ENTRADA'" [class.text-red]="item.accion?.nombre === 'SALIDA'">
                            {{ item.accion?.nombre === 'SALIDA' ? '-' : '+' }}{{ item.cantidad | number:'1.0-0' }}
                          </strong>
                        </td>
                        <td>{{ item.usuario || 'Sistema' }}</td>
                        <td>{{ item.descripcion || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination 
                [currentPage]="historyCurrentPage" 
                [totalPages]="historyTotalPages" 
                [totalItems]="historyTotalItems"
                (pageChange)="onHistoryPageChange($event)">
              </app-pagination>
            }
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="closeHistoryModal()">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: 1rem; }
    
    .text-green { color: #2e7d32; }
    .text-red { color: #c62828; }
    .requerido { color: #f44336; }

    .input-disabled { background: #f5f5f5; cursor: not-allowed; }

    /* History Modal Styles */
    .large-modal { max-width: 950px; width: 95%; }
    .history-controls { display: flex; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .table-responsive { max-height: 400px; overflow-y: auto; border: 1px solid var(--gray-medium); border-radius: 8px; }

    @media (max-width: 768px) { .history-controls { flex-direction: column; align-items: stretch; } }
  `],
})
export class SuppliesComponent implements OnInit {
  public permissions = inject(PermissionsService);
  private fb = inject(FormBuilder);
  private suppliesService = inject(SuppliesService);
  private categoriesService = inject(SupplyCategoriesService);
  private unitsService = inject(MeasurementUnitsService);
  private supplyHistoryService = inject(SupplyHistoryService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);
  private refreshService = inject(DashboardRefreshService);

  Number = Number; // Expose to template

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
  limit = 5;

  showModal = signal(false);
  editing = signal<Supply | null>(null);
  saving = signal(false);
  
  // Stats
  totalAlimento = signal(0);
  totalHerramientas = signal(0);
  totalMedicamentos = signal(0);
  totalInsumos = signal(0);

  // Form matching CreateSupplyDto & UpdateSupplyDto
  supplyForm = this.fb.group({
    nombre: ['', Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]],
    id_categoria: ['', Validators.required],
    id_unidad_medida: ['', Validators.required],
    stockMinimo: [0, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]],
    fecha: [new Date().toISOString().split('T')[0], Validators.required],
    proveedor: [''],
    precioUnitario: [null as number | null, [Validators.min(0)]],
  });

  // Reabastecer Modal State
  showReabastecerModal = signal(false);
  selectedSupply = signal<Supply | null>(null);
  submittingReabastecer = signal(false);

  reabastecerForm = this.fb.group({
    cantidad: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern('^[0-9]+$')]],
    motivo: ['', Validators.required],
  });

  // History Modal State
  showHistoryModal = signal(false);
  historyLoading = signal(false);
  historyItems = signal<SupplyHistory[]>([]);
  historySearchQuery = '';
  historySearchSubject = new Subject<string>();
  historyType = 'todos';

  // History Pagination
  historyCurrentPage = 1;
  historyTotalPages = 1;
  historyTotalItems = 0;
  historyLimit = 5;

  ngOnInit(): void {
    this.loadData();
    this.categoriesService.getAll().subscribe((c) => this.categories.set(c));
    this.unitsService.getAll().subscribe((u) => this.units.set(u));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    this.historySearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.historyCurrentPage = 1;
      this.loadHistory();
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.suppliesService.getAllPaginated({ 
      page: this.currentPage, 
      limit: this.limit, 
      search: this.searchQuery 
    }).subscribe({
      next: (res: any) => {
        const data = res?.data || (Array.isArray(res) ? res : []);
        this.supplies.set(data);
        this.filtered.set(data);
        this.totalItems = res?.total ?? data.length;
        this.totalPages = res?.totalPages ?? 1;
        this.currentPage = res?.page ?? 1;
        this.computeStats(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeStats(data: Supply[]): void {
    // Stats are computed from total supplies in the current page
    let alimento = 0, herramientas = 0, medicamentos = 0;
    data.forEach((s) => {
      const cat = (s.categoria?.nombre_categoria || '').toLowerCase();
      if (cat.includes('alimento')) alimento += Number(s.cantidad) || 0;
      else if (cat.includes('herramienta')) herramientas += Number(s.cantidad) || 0;
      else if (cat.includes('medicamento')) medicamentos += Number(s.cantidad) || 0;
    });
    this.totalAlimento.set(alimento);
    this.totalHerramientas.set(herramientas);
    this.totalMedicamentos.set(medicamentos);
    this.totalInsumos.set(this.totalItems);
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onCategoryFilterChange(): void {
    // Apply client-side filter combined with pagination query if applicable
    this.currentPage = 1;
    if (this.filterCategory === 'todos') {
      this.loadData();
    } else {
      this.loading.set(true);
      // Retrieve everything matching category client-side or filtered
      this.suppliesService.getAllPaginated({ page: 1, limit: 100, search: this.searchQuery }).subscribe({
        next: (res: any) => {
          const data = res?.data || (Array.isArray(res) ? res : []);
          const matched = data.filter((s: any) => s.categoria?.nombre_categoria === this.filterCategory);
          this.filtered.set(matched);
          this.totalItems = matched.length;
          this.totalPages = 1;
          this.currentPage = 1;
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  openModal(): void { 
    this.editing.set(null); 
    this.supplyForm.reset({ 
      fecha: new Date().toISOString().split('T')[0],
      stockMinimo: 0,
      precioUnitario: null,
      proveedor: ''
    }); 
    this.showModal.set(true); 
  }

  closeModal(): void { 
    this.showModal.set(false); 
  }

  editSupply(supply: Supply): void {
    this.editing.set(supply);
    this.supplyForm.patchValue({
      nombre: supply.nombre,
      cantidad: supply.cantidad ?? null,
      id_categoria: String(supply.categoria?.id_categoria_insumo || supply.id_categoria || ''),
      id_unidad_medida: String(supply.unidadMedida?.id_unidad_medida || supply.id_unidad_medida || ''),
      stockMinimo: supply.stockMinimo ?? 0,
      fecha: supply.fecha ? new Date(supply.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      proveedor: supply.proveedor || '',
      precioUnitario: supply.precioUnitario ?? null,
    });
    this.showModal.set(true);
  }

  save(): void {
    if (this.supplyForm.invalid) { this.supplyForm.markAllAsTouched(); return; }
    this.saving.set(true);

    const formData = this.supplyForm.value;
    const data: Record<string, unknown> = {
      nombre: formData.nombre,
      cantidad: Number(formData.cantidad),
      id_categoria: formData.id_categoria,
      id_unidad_medida: formData.id_unidad_medida,
      stockMinimo: Number(formData.stockMinimo),
      fecha: formData.fecha,
      proveedor: formData.proveedor || null,
      precioUnitario: formData.precioUnitario !== null && formData.precioUnitario !== undefined && (formData.precioUnitario as any) !== '' ? Number(formData.precioUnitario) : 0,
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

  async deleteSupply(id: string) {
    const supply = this.supplies().find(s => s.id_insumo === id);
    const supplyName = supply ? supply.nombre : '';

    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el insumo '${supplyName}'? Esta acción no se puede deshacer.`
    });

    if (!confirmed) return;

    this.suppliesService.delete(id).subscribe({
      next: () => {
        this.toast.success('Insumo eliminado');
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: () => this.toast.error('Error al eliminar el insumo'),
    });
  }

  // Reabastecer methods
  openReabastecerModal(supply: Supply): void {
    this.selectedSupply.set(supply);
    this.reabastecerForm.reset({
      cantidad: null,
      motivo: ''
    });
    this.showReabastecerModal.set(true);
  }

  closeReabastecerModal(): void {
    this.showReabastecerModal.set(false);
    this.selectedSupply.set(null);
  }

  submitReabastecer(): void {
    if (this.reabastecerForm.invalid) {
      this.reabastecerForm.markAllAsTouched();
      return;
    }
    const supply = this.selectedSupply();
    if (!supply) return;

    this.submittingReabastecer.set(true);
    const val = this.reabastecerForm.value;

    this.suppliesService.reabastecer(supply.id_insumo, Number(val.cantidad), val.motivo || '').subscribe({
      next: () => {
        this.toast.success('Insumo reabastecido con éxito');
        this.closeReabastecerModal();
        this.loadData();
        this.refreshService.notifyDataChanged();
        this.submittingReabastecer.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${msg}` : 'Error al reabastecer el insumo');
        this.submittingReabastecer.set(false);
      }
    });
  }

  // History methods
  openHistoryModal(): void {
    this.historySearchQuery = '';
    this.historyType = 'todos';
    this.historyCurrentPage = 1;
    this.showHistoryModal.set(true);
    this.loadHistory();
  }

  closeHistoryModal(): void {
    this.showHistoryModal.set(false);
  }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.supplyHistoryService.getPaginated({
      page: this.historyCurrentPage,
      limit: this.historyLimit,
      search: this.historySearchQuery,
      tipo: this.historyType
    }).subscribe({
      next: (res: any) => {
        const data = res?.data || (Array.isArray(res) ? res : []);
        this.historyItems.set(data);
        this.historyTotalItems = res?.total ?? data.length;
        this.historyTotalPages = res?.totalPages ?? 1;
        this.historyCurrentPage = res?.page ?? 1;
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
        this.toast.error('Error al cargar el historial de movimientos');
      }
    });
  }

  onHistorySearchInput(): void {
    this.historySearchSubject.next(this.historySearchQuery);
  }

  onHistoryFilterChange(): void {
    this.historyCurrentPage = 1;
    this.loadHistory();
  }

  onHistoryPageChange(page: number): void {
    this.historyCurrentPage = page;
    this.loadHistory();
  }
}
