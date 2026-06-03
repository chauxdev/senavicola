import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FlocksService, BarnsService, BreedsService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { Flock, Barn, Breed } from '../../core/models';

@Component({
  selector: 'app-flocks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  template: `
    <div class="flocks-page">
      <!-- Module Header -->
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-dove"></i></div>
          <div>
            <h2>Gestión de Gallinas por Galpón</h2>
            <p>Registra lotes, galpones y controla tus gallinas fácilmente.</p>
          </div>
        </div>
        <div class="module-header-right">
          @if (permissions.canWrite()) {
            <button class="btn-green" (click)="openModal('flock')">
              <i class="fas fa-plus"></i> Registrar Lote
            </button>
            <button class="btn-outline" (click)="openModal('barn')">
              <i class="fas fa-plus"></i> Registrar Galpón
            </button>
          }
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fas fa-dove"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Gallinas</div>
            <div class="stat-value">{{ totalGallinas() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
          <div class="stat-info">
            <div class="stat-label">Lotes Activos</div>
            <div class="stat-value">{{ activeFlocks() }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><i class="fas fa-warehouse"></i></div>
          <div class="stat-info">
            <div class="stat-label">Galpones</div>
            <div class="stat-value">{{ barns().length }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fas fa-skull-crossbones"></i></div>
          <div class="stat-info">
            <div class="stat-label">Total Lotes</div>
            <div class="stat-value">{{ flocks().length }}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active]="activeTab() === 'flocks'" (click)="activeTab.set('flocks')">
          <i class="fas fa-layer-group"></i> Lotes
        </button>
        <button class="tab-btn" [class.active]="activeTab() === 'barns'" (click)="activeTab.set('barns')">
          <i class="fas fa-warehouse"></i> Galpones
        </button>
      </div>

      <!-- Flocks Table -->
      @if (activeTab() === 'flocks') {
        <div class="table-container">
          <div class="table-header">
            <h3>Listado de Lotes</h3>
            <div class="table-actions">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar lote..." [(ngModel)]="searchQuery" (input)="onSearchInput()" />
              </div>
            </div>
          </div>
          @if (loading()) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else if (filteredFlocks().length === 0) {
            <div class="empty-state">
              <i class="fas fa-dove"></i>
              <h3>No hay lotes registrados</h3>
              <p>Registra tu primer lote haciendo clic en "Registrar Lote"</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Total Aves</th>
                    <th>Estado</th>
                    <th>Raza</th>
                    <th>Galpón</th>
                    <th>Observación</th>
                    @if (permissions.canWrite()) {
                      <th>Acciones</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (flock of filteredFlocks(); track flock.id_lote) {
                    <tr>
                      <td><span class="badge active">{{ flock.id_lote.substring(0, 8) }}…</span></td>
                      <td><strong>{{ flock.nombre }}</strong></td>
                      <td>{{ flock.total_aves | number }}</td>
                      <td>
                        <span class="badge {{ flock.estado === 'activo' ? 'active' : 'finished' }}">
                          {{ flock.estado || 'activo' }}
                        </span>
                      </td>
                      <td>{{ flock.raza?.nombre || '—' }}</td>
                      <td>{{ flock.ubicacion?.[0]?.galpon?.nombre || '—' }}</td>
                      <td>{{ flock.observacion || '—' }}</td>
                      @if (permissions.canWrite()) {
                        <td class="actions-cell">
                          @if (flock.estado === 'activo') {
                            <button class="btn-icon edit" title="Registrar Aves Muertas" (click)="openDeadBirdsModal(flock)">
                              <i class="fas fa-skull-crossbones"></i>
                            </button>
                            <button class="btn-icon view" title="Finalizar Lote" (click)="finalizeFlock(flock)">
                              <i class="fas fa-flag-checkered"></i>
                            </button>
                          }
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
      }

      <!-- Barns Table -->
      @if (activeTab() === 'barns') {
        <div class="table-container">
          <div class="table-header">
            <h3>Listado de Galpones</h3>
          </div>
          @if (barns().length === 0) {
            <div class="empty-state">
              <i class="fas fa-warehouse"></i>
              <h3>No hay galpones registrados</h3>
              <p>Registra tu primer galpón</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Código</th><th>Nombre</th><th>Capacidad</th><th>Longitud</th><th>Área</th><th>Unidad</th>
                    @if (permissions.canWrite()) {
                      <th>Acciones</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (barn of barns(); track barn.id_galpon) {
                    <tr>
                      <td><span class="badge active">{{ barn.id_galpon.substring(0, 8) }}…</span></td>
                      <td>{{ barn.codigo }}</td>
                      <td><strong>{{ barn.nombre }}</strong></td>
                      <td>{{ barn.capacidad_max_aves || '—' }}</td>
                      <td>{{ barn.longitud || '—' }} m</td>
                      <td>{{ barn.area || '—' }}</td>
                      <td>{{ barn.unidadMedida?.nombre || '—' }}</td>
                      @if (permissions.canWrite()) {
                        <td class="actions-cell">
                          <button class="btn-icon edit" (click)="editBarn(barn)"><i class="fas fa-edit"></i></button>
                          <button class="btn-icon delete" (click)="deleteBarn(barn.id_galpon)"><i class="fas fa-trash"></i></button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
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
    </div>

    <!-- Modal Registrar Lote -->
    @if (showFlockModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-dove"></i> Registrar Nuevo Lote</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="flockForm">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-tag"></i> Nombre del Lote</label>
                  <input type="text" formControlName="nombre" placeholder="Ej: Lote A-2026" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-dove"></i> Total de Aves</label>
                  <input type="number" formControlName="total_aves" placeholder="Ej: 500" min="1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-dna"></i> Raza</label>
                  <select formControlName="razaId">
                    <option value="">Seleccionar raza</option>
                    @for (breed of breeds(); track breed.id_raza) {
                      <option [value]="breed.id_raza">{{ breed.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Galpón</label>
                  <select formControlName="galponId">
                    <option value="">Seleccionar galpón</option>
                    @for (barn of barns(); track barn.id_galpon) {
                      <option [value]="barn.id_galpon">{{ barn.nombre }} (Cap: {{ barn.capacidad_max_aves }})</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-utensils"></i> Ración de Alimento</label>
                  <input type="text" formControlName="racion_alimento" placeholder="Ej: 120g/día" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Observación</label>
                <textarea formControlName="observacion" placeholder="Observaciones..." rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="saveFlock()" [disabled]="savingFlock()">
              @if (savingFlock()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
              Guardar Lote
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Registrar Galpón -->
    @if (showBarnModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-warehouse"></i> {{ editingBarn() ? 'Editar Galpón' : 'Registrar Galpón' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="barnForm">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-barcode"></i> Código</label>
                  <input type="text" formControlName="codigo" placeholder="Ej: G-001" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Nombre del Galpón</label>
                  <input type="text" formControlName="nombre" placeholder="Ej: Galpón 1" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-users"></i> Capacidad Máx. Aves</label>
                  <input type="number" formControlName="capacidadMaxAves" placeholder="Ej: 500" min="1" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-ruler-horizontal"></i> Longitud (m)</label>
                  <input type="number" formControlName="longitud" placeholder="Ej: 20" min="1" step="0.1" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="saveBarn()" [disabled]="savingBarn()">
              @if (savingBarn()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
              {{ editingBarn() ? 'Actualizar' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Aves Muertas -->
    @if (showDeadBirdsModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-skull-crossbones"></i> Registrar Aves Muertas</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="deadBirdsForm">
              <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Lote</label>
                <input type="text" [value]="selectedFlock()?.nombre || 'Lote ' + selectedFlock()?.id_lote?.substring(0, 8)" disabled />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-skull-crossbones"></i> Cantidad</label>
                  <input type="number" formControlName="cantidad" placeholder="Cantidad de aves muertas" min="1" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-calendar"></i> Fecha</label>
                  <input type="date" formControlName="fecha" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Motivo</label>
                <textarea formControlName="motivo" placeholder="Motivo del deceso..." rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-danger" (click)="saveDeadBirds()" [disabled]="savingDeadBirds()">
              @if (savingDeadBirds()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
              Registrar
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tabs-container { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
    .tab-btn {
      padding: 1rem 2rem; border: 2px solid var(--gray-medium); background: white;
      border-radius: 8px; font-size: 1.4rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 0.8rem; transition: all 0.2s;
      font-family: 'Work Sans', sans-serif;
      &.active { background: var(--primary-green); color: white; border-color: var(--primary-green); }
    }
    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse;
      th { padding: 1.2rem 1.5rem; background: var(--gray-light); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; color: var(--gray-dark); text-align: left; }
      td { padding: 1.2rem 1.5rem; border-top: 1px solid var(--gray-medium); font-size: 1.4rem; }
      tr:hover td { background: rgba(57,169,0,0.03); }
    }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; padding: 0.3rem; border-radius: 6px; &:hover { background: var(--gray-light); } }
    .spinner-sm { width: 1.6rem; height: 1.6rem; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class FlocksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private flocksService = inject(FlocksService);
  private barnsService = inject(BarnsService);
  private breedsService = inject(BreedsService);
  private toast = inject(ToastService);
  public permissions = inject(PermissionsService);

  loading = signal(true);
  flocks = signal<Flock[]>([]);
  filteredFlocks = signal<Flock[]>([]);
  barns = signal<Barn[]>([]);
  breeds = signal<Breed[]>([]);
  activeTab = signal<'flocks' | 'barns'>('flocks');
  searchQuery = '';
  searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 10;

  showFlockModal = signal(false);
  showBarnModal = signal(false);
  showDeadBirdsModal = signal(false);
  savingFlock = signal(false);
  savingBarn = signal(false);
  savingDeadBirds = signal(false);
  editingBarn = signal<Barn | null>(null);
  selectedFlock = signal<Flock | null>(null);

  showConfirmModal = signal(false);
  confirmMessage = '';
  confirmAction: (() => void) | null = null;

  totalGallinas = signal(0);
  activeFlocks = signal(0);

  // Form matching CreateFlockDto: { nombre, total_aves, razaId, observacion, racion_alimento, galponId }
  flockForm = this.fb.group({
    nombre: ['', Validators.required],
    total_aves: [null as number | null, [Validators.required, Validators.min(1)]],
    razaId: ['', Validators.required],
    galponId: ['', Validators.required],
    observacion: ['', Validators.required],
    racion_alimento: ['', Validators.required],
  });

  // Form matching CreateBarnDto: { codigo, nombre, capacidadMaxAves, longitud }
  barnForm = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    capacidadMaxAves: [null as number | null, [Validators.required, Validators.min(1)]],
    longitud: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  deadBirdsForm = this.fb.group({
    cantidad: [null, [Validators.required, Validators.min(1)]],
    fecha: [new Date().toISOString().split('T')[0]],
    motivo: [''],
  });

  ngOnInit(): void {
    this.loadData();
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.flocksService.getAllPaginated({ page: this.currentPage, limit: this.limit, search: this.searchQuery }).subscribe({
      next: (res) => {
        this.flocks.set(res.data);
        this.filteredFlocks.set(res.data);
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        const activos = res.data.filter((f: any) => f.estado === 'ACTIVO');
        this.activeFlocks.set(activos.length);
        this.totalGallinas.set(activos.reduce((s: number, f: any) => s + (f.total_aves || 0), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.barnsService.getAll().subscribe((b) => this.barns.set(b));
    this.breedsService.getAll().subscribe((b) => this.breeds.set(b));
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  filterFlocks(): void {
    // Legacy filter
    const q = this.searchQuery.toLowerCase();
    this.filteredFlocks.set(this.flocks().filter((f) => `${f.nombre} ${f.raza?.nombre}`.toLowerCase().includes(q)));
  }

  openModal(type: 'flock' | 'barn'): void {
    if (type === 'flock') { this.flockForm.reset(); this.showFlockModal.set(true); }
    if (type === 'barn') { this.barnForm.reset(); this.editingBarn.set(null); this.showBarnModal.set(true); }
  }

  closeModals(): void {
    this.showFlockModal.set(false);
    this.showBarnModal.set(false);
    this.showDeadBirdsModal.set(false);
  }

  saveFlock(): void {
    if (this.flockForm.invalid) { this.flockForm.markAllAsTouched(); return; }
    this.savingFlock.set(true);
    const data = this.flockForm.value;
    this.flocksService.create(data as Partial<Flock>).subscribe({
      next: () => { this.toast.success('Lote registrado exitosamente'); this.closeModals(); this.loadData(); },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al registrar el lote');
        this.savingFlock.set(false);
      },
      complete: () => this.savingFlock.set(false),
    });
  }

  saveBarn(): void {
    if (this.barnForm.invalid) { this.barnForm.markAllAsTouched(); return; }
    const data = this.barnForm.value as Partial<Barn>;
    const editing = this.editingBarn();
    const req = editing ? this.barnsService.update(editing.id_galpon, data) : this.barnsService.create(data);
    req.subscribe({
      next: () => { this.toast.success(editing ? 'Galpón actualizado' : 'Galpón registrado'); this.closeModals(); this.loadData(); },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar el galpón');
      },
    });
  }

  editBarn(barn: Barn): void {
    this.editingBarn.set(barn);
    this.barnForm.patchValue({
      codigo: barn.codigo,
      nombre: barn.nombre,
      capacidadMaxAves: barn.capacidad_max_aves ?? null,
      longitud: barn.longitud ?? null,
    });
    this.showBarnModal.set(true);
  }

  deleteBarn(id: string): void {
    this.requestConfirm('¿Eliminar este galpón?', () => {
      this.barnsService.delete(id).subscribe({
        next: () => { this.toast.success('Galpón eliminado'); this.loadData(); },
        error: () => this.toast.error('Error al eliminar el galpón'),
      });
    });
  }

  openDeadBirdsModal(flock: Flock): void {
    this.selectedFlock.set(flock);
    this.deadBirdsForm.reset({ fecha: new Date().toISOString().split('T')[0] });
    this.showDeadBirdsModal.set(true);
  }

  saveDeadBirds(): void {
    const flock = this.selectedFlock();
    if (!flock || this.deadBirdsForm.invalid) return;
    this.savingDeadBirds.set(true);
    const data = { id_lote: flock.id_lote, ...this.deadBirdsForm.value };
    this.flocksService.registerDeadBirds(data as unknown as { id_lote: string; cantidad: number; fecha?: string; motivo?: string }).subscribe({
      next: () => { this.toast.success('Registro de aves muertas guardado'); this.closeModals(); this.loadData(); },
      error: () => { this.toast.error('Error al registrar aves muertas'); this.savingDeadBirds.set(false); },
      complete: () => this.savingDeadBirds.set(false),
    });
  }

  finalizeFlock(flock: Flock): void {
    this.requestConfirm(`¿Finalizar el Lote "${flock.nombre}"? Esta acción no se puede deshacer.`, () => {
      this.flocksService.finalizeFlock({ id_lote: flock.id_lote }).subscribe({
        next: () => { this.toast.success('Lote finalizado exitosamente'); this.loadData(); },
        error: () => this.toast.error('Error al finalizar el lote'),
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
