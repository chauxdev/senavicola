import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EggInventoryService, EggTypesService, FlocksService, BarnsService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { EggInventory, EggType, Flock, Barn } from '../../core/models';

@Component({
  selector: 'app-eggs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  template: `
    <div class="eggs-page">
      <!-- Header del Módulo -->
      <div class="header_modulo">
        <div class="header_modulo_izq">
          <i class="fas fa-egg icono_modulo"></i>
          <div>
            <h2 class="titulo_modulo">Gestión de Huevos</h2>
            <p class="subtitulo_modulo">Administrar y clasificar huevos de manera eficiente.</p>
          </div>
        </div>
      </div>

      <!-- Cards de Estadísticas -->
      <div class="contenedor_cards_huevos">
        <div class="card_stat_huevo">
          <p class="card_label_huevo">Total Hoy</p>
          <h3 class="card_valor_huevo card_azul">{{ totalToday() }}</h3>
        </div>
        @for (type of eggTypes(); track type.id_tipo) {
          <div class="card_stat_huevo">
            <p class="card_label_huevo">{{ type.tipo }}</p>
            <h3 class="card_valor_huevo" [class]="typeColorClass($index)">{{ getCountByType(type.id_tipo) }}</h3>
          </div>
        }
      </div>

      <!-- Sección Clasificar Huevos -->
      <div class="seccion_clasificar">
        <div class="clasificar_header">
          <i class="fas fa-balance-scale"></i>
          <div>
            <h3 class="clasificar_titulo">Clasificar Huevos</h3>
            <p class="clasificar_subtitulo">Ingrese la cantidad de huevos para obtener su clasificación</p>
          </div>
        </div>

        <!-- Tabs de Clasificación -->
        <div class="tabs_clasificacion">
          <button class="tab_clasificacion_btn" [class.activo]="classifTab() === 'manual'" (click)="classifTab.set('manual')">
            CLASIFICACIÓN MANUAL
          </button>
          <button class="tab_clasificacion_btn" [class.activo]="classifTab() === 'automatica'" (click)="classifTab.set('automatica')">
            CLASIFICACIÓN AUTOMÁTICA
          </button>
        </div>

        @if (classifTab() === 'manual') {
          <!-- Categorías Info -->
          <div class="categorias_info">
            <div class="categoria_titulo_seccion">
              <i class="fas fa-info-circle"></i>
              <span>Categoría de clasificación</span>
            </div>
            <div class="categorias_grid">
              <div class="categoria_card morado"><h4>Jumbo</h4><p>&gt; 73 gr</p></div>
              <div class="categoria_card verde"><h4>AAA</h4><p>63-73 gr</p></div>
              <div class="categoria_card verde_claro"><h4>AA</h4><p>53-63 gr</p></div>
              <div class="categoria_card amarillo"><h4>A</h4><p>43-53 gr</p></div>
              <div class="categoria_card naranja"><h4>B</h4><p>33-43 gr</p></div>
              <div class="categoria_card rojo"><h4>C</h4><p>&lt; 33 gr</p></div>
            </div>
          </div>

          <!-- Formulario de Clasificación -->
          @if (permissions.canWrite()) {
            <form [formGroup]="classifyForm" class="form_clasificar" (ngSubmit)="saveProduction()">
              <div class="form_row">
                <div class="form_group">
                  <label>Seleccionar Lote</label>
                  <select formControlName="loteId">
                    <option value="">Seleccionar</option>
                    @for (flock of flocks(); track flock.id_lote) {
                      <option [value]="flock.id_lote">{{ flock.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form_group">
                  <label>Seleccionar Tipo de Huevo</label>
                  <select formControlName="tipoHuevoId">
                    <option value="">Seleccionar</option>
                    @for (type of eggTypes(); track type.id_tipo) {
                      <option [value]="type.id_tipo">{{ type.tipo }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form_row">
                <div class="form_group">
                  <label>Cantidad de huevos</label>
                  <input type="number" formControlName="cantidad" placeholder="Ej: 30" min="1" />
                </div>
                <div class="form_group_btn">
                  <button type="submit" class="btn_clasificar" [disabled]="saving()">
                    <i class="fas fa-search"></i> Clasificar
                  </button>
                </div>
              </div>
            </form>
          } @else {
            <div class="texto_placeholder">No tienes permisos para clasificar huevos.</div>
          }
        }

        @if (classifTab() === 'automatica') {
          <div class="texto_placeholder">
            <i class="fas fa-video-slash" style="font-size:4rem;margin-bottom:1rem;display:block;color:var(--gray-dark)"></i>
            Clasificación automática por cámara (próximamente)
          </div>
        }
      </div>

      <!-- Tabs de Inventario -->
      <div class="contenedor_tabs">
        <div class="tabs_header">
          <button class="tab_btn" [class.activo]="activeTab() === 'inventario'" (click)="onTabChange('inventario')">Inventario Disponible</button>
          <button class="tab_btn" [class.activo]="activeTab() === 'danados'" (click)="onTabChange('danados')">Huevos Dañados</button>
          <button class="tab_btn" [class.activo]="activeTab() === 'historial'" (click)="onTabChange('historial')">Historial</button>
        </div>

        <div class="tabs_content">
          @if (activeTab() === 'inventario') {
            <div class="controles_tabla" style="gap: 1rem;">
              <select class="select_filtro" [(ngModel)]="filterType" (change)="filterInventory()">
                <option value="todos">Todos los tipos</option>
                @for (type of eggTypes(); track type.id_tipo) {
                  <option [value]="type.tipo">{{ type.tipo }}</option>
                }
              </select>
              <div class="search-bar" style="display: flex; align-items: center; border: 2px solid #e0e0e0; border-radius: 8px; padding: 0 1rem; background: white;">
                <i class="fas fa-search" style="color: #666; margin-right: 0.5rem;"></i>
                <input type="text" placeholder="Buscar lote..." style="border: none; outline: none; padding: 1.2rem 0; font-size: 1.5rem; width: 250px;" [(ngModel)]="searchQuery" (input)="onSearchInput()" />
              </div>
            </div>
            @if (loading()) {
              <div class="loading-container"><div class="spinner"></div></div>
            } @else if (filtered().length === 0) {
              <div class="empty-state">
                <i class="fas fa-egg"></i>
                <h3>No hay registros de huevos</h3>
                <p>Clasifica huevos usando el formulario de arriba</p>
              </div>
            } @else {
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr><th>Tipo</th><th>Cantidad</th><th>Lote</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    @for (item of filtered(); track item.id_inventario_huevo) {
                      <tr>
                        <td><span class="badge_estado disponible">{{ item.tipo_huevo?.tipo || '—' }}</span></td>
                        <td><strong>{{ item.cantidad }}</strong></td>
                        <td>{{ item.lote?.nombre || '—' }}</td>
                        <td>
                          @if (permissions.canWrite()) {
                            <button class="btn_accion btn_editar" (click)="openDamagedModal(item)">
                              <i class="fas fa-exclamation-circle"></i> Dañados
                            </button>
                          }
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
          }

          @if (activeTab() === 'danados') {
            <div class="texto_placeholder">Huevos dañados (próximamente)</div>
          }
          @if (activeTab() === 'historial') {
            <div class="controles_tabla" style="gap: 1rem;">
              <select class="select_filtro" [(ngModel)]="historyPeriod" (change)="onHistoryPeriodChange()">
                <option value="semanal">Últimos 7 días</option>
                <option value="mensual">Último mes</option>
                <option value="trimestral">Últimos 3 meses</option>
              </select>
            </div>
            @if (loading()) {
              <div class="loading-container"><div class="spinner"></div></div>
            } @else if (historyItems().length === 0) {
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No hay registros de producción</h3>
                <p>No se encontraron datos en el período seleccionado.</p>
              </div>
            } @else {
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr><th>Fecha</th><th>Lote</th><th>Tipo Huevo</th><th>Cantidad</th></tr>
                  </thead>
                  <tbody>
                    @for (item of historyItems(); track item.id_produccion_huevo) {
                      <tr>
                        <td>{{ item.produccionFecha | date:'short' }}</td>
                        <td>{{ item.lote?.nombre || '—' }}</td>
                        <td>{{ item.tipo_huevo?.tipo || '—' }}</td>
                        <td><strong>{{ item.cantidady }}</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination 
                [currentPage]="hCurrentPage" 
                [totalPages]="hTotalPages" 
                [totalItems]="hTotalItems"
                (pageChange)="onHistoryPageChange($event)">
              </app-pagination>
            }
          }
        </div>
      </div>
    </div>

    <!-- Modal Dañados -->
    @if (showDamagedModal()) {
      <div class="modal activo" (click)="showDamagedModal.set(false)">
        <div class="modal_contenido" (click)="$event.stopPropagation()">
          <div class="modal_header">
            <div class="modal_header_icon"><i class="fas fa-exclamation-circle"></i></div>
            <h3 class="modal_titulo">Actualizar Huevos Dañados</h3>
          </div>
          <form [formGroup]="damagedForm" class="modal_form" (ngSubmit)="saveDamaged()">
            <div class="form_group">
              <label>Cantidad Disponible</label>
              <input type="number" [value]="selectedInventory()?.cantidad || 0" readonly />
            </div>
            <div class="form_group">
              <label>Cantidad Dañada</label>
              <input type="number" formControlName="cantidad" placeholder="Ej: 5" min="1" />
            </div>
            <div class="form_group">
              <label>Razón</label>
              <input type="text" formControlName="razon" placeholder="Ej: Rotos en transporte" />
            </div>
            <div class="modal_botones">
              <button type="button" class="btn_cancelar" (click)="showDamagedModal.set(false)">Cancelar</button>
              <button type="submit" class="btn_registrar" [disabled]="saving()">Actualizar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrls: [],
  styles: [`
    /* Cards Huevos */
    .contenedor_cards_huevos { display: flex; gap: 1.5rem; margin-bottom: 3rem; flex-wrap: wrap; }
    .card_stat_huevo { background: white; padding: 2rem 2.5rem; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; flex: 1; min-width: 120px; transition: all 0.3s ease; }
    .card_stat_huevo:hover { transform: translateY(-5px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .card_label_huevo { font-size: 1.3rem; color: #666; margin-bottom: 0.5rem; font-weight: 600; }
    .card_valor_huevo { font-size: 3rem; font-weight: 700; }
    .card_azul { color: #2196f3; }
    .card_morado { color: #9c27b0; }
    .card_verde { color: #4caf50; }
    .card_verde_claro { color: #66bb6a; }
    .card_amarillo { color: #ffc107; }
    .card_naranja { color: #ff9800; }
    .card_rojo { color: #f44336; }

    /* Clasificar */
    .seccion_clasificar { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 2.5rem; margin-bottom: 3rem; }
    .clasificar_header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
    .clasificar_header i { font-size: 3rem; color: var(--primary-green); }
    .clasificar_titulo { font-size: 2rem; font-weight: 700; }
    .clasificar_subtitulo { font-size: 1.4rem; color: #666; }

    /* Tabs clasificación */
    .tabs_clasificacion { display: flex; margin-bottom: 2rem; border-bottom: 2px solid #e0e0e0; }
    .tab_clasificacion_btn { flex: 1; padding: 1.5rem; background: transparent; border: none; font-size: 1.4rem; font-weight: 700; color: #666; cursor: pointer; transition: all 0.3s; position: relative; text-transform: uppercase; letter-spacing: 1px; }
    .tab_clasificacion_btn.activo { color: var(--primary-green); }
    .tab_clasificacion_btn.activo::after { content: ""; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: var(--primary-green); }

    /* Categorías */
    .categorias_info { margin-bottom: 2rem; }
    .categoria_titulo_seccion { display: flex; align-items: center; gap: 0.8rem; font-size: 1.4rem; font-weight: 600; color: #666; margin-bottom: 1.5rem; }
    .categorias_grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
    .categoria_card { padding: 1.5rem; border-radius: 10px; text-align: center; color: white; }
    .categoria_card h4 { font-size: 1.6rem; font-weight: 700; }
    .categoria_card p { font-size: 1.2rem; margin-top: 0.3rem; }
    .categoria_card.morado { background: #9c27b0; }
    .categoria_card.verde { background: #4caf50; }
    .categoria_card.verde_claro { background: #66bb6a; }
    .categoria_card.amarillo { background: #ffc107; color: #333; }
    .categoria_card.naranja { background: #ff9800; }
    .categoria_card.rojo { background: #f44336; }

    /* Form clasificar */
    .form_clasificar { display: flex; flex-direction: column; gap: 1.5rem; }
    .form_row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form_group { display: flex; flex-direction: column; gap: 0.8rem; }
    .form_group label { font-size: 1.4rem; font-weight: 600; color: #333; }
    .form_group input, .form_group select { padding: 1.2rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.5rem; font-family: 'Work Sans', sans-serif; transition: all 0.3s; }
    .form_group input:focus, .form_group select:focus { outline: none; border-color: var(--primary-green); }
    .form_group_btn { display: flex; align-items: flex-end; }
    .btn_clasificar { background: var(--primary-green); color: white; border: none; padding: 1.2rem 2.5rem; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.8rem; transition: all 0.3s; }
    .btn_clasificar:hover { background: #2d8600; }
    .btn_clasificar:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Tabs inventario */
    .contenedor_tabs { background: white; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .tabs_header { display: flex; background: #f5f5f5; border-bottom: 2px solid #e0e0e0; }
    .tab_btn { flex: 1; padding: 1.8rem 2rem; background: transparent; border: none; font-size: 1.5rem; font-weight: 600; color: #666; cursor: pointer; transition: all 0.3s; position: relative; }
    .tab_btn:hover { background: rgba(57,169,0,0.1); color: var(--primary-green); }
    .tab_btn.activo { background: white; color: var(--primary-green); }
    .tab_btn.activo::after { content: ""; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px; background: var(--primary-green); }
    .tabs_content { padding: 3rem; }

    /* Tabla */
    .controles_tabla { display: flex; justify-content: flex-start; margin-bottom: 2rem; }
    .select_filtro { padding: 1.2rem 3rem 1.2rem 1.5rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.5rem; background: white; cursor: pointer; }
    .tabla_contenedor { overflow-x: auto; }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla thead { background: #f5f5f5; }
    .tabla th { padding: 1.5rem; text-align: left; font-size: 1.4rem; font-weight: 700; color: #333; border-bottom: 2px solid #e0e0e0; }
    .tabla td { padding: 1.5rem; font-size: 1.4rem; color: #333; border-bottom: 1px solid #e0e0e0; }
    .tabla tbody tr { transition: background 0.2s; }
    .tabla tbody tr:hover { background: rgba(57,169,0,0.05); }
    .badge_estado { padding: 0.6rem 1.2rem; border-radius: 20px; font-size: 1.3rem; font-weight: 600; display: inline-block; }
    .badge_estado.disponible { background: #e8f5e9; color: #2e7d32; }
    .btn_accion { padding: 0.8rem 1.5rem; border: none; border-radius: 6px; font-size: 1.3rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_editar { background: #2196f3; color: white; }
    .btn_editar:hover { background: #1976d2; }
    .texto_placeholder { text-align: center; padding: 5rem; font-size: 1.8rem; color: #666; }

    /* Modal */
    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal_contenido { background: white; border-radius: 15px; width: 90%; max-width: 500px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); animation: modalSlideIn 0.3s ease; }
    @keyframes modalSlideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal_header { background: var(--primary-green); color: white; padding: 2rem; border-radius: 15px 15px 0 0; display: flex; align-items: center; gap: 1.5rem; }
    .modal_header_icon { width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 2.4rem; }
    .modal_titulo { font-size: 2rem; font-weight: 700; }
    .modal_form { padding: 2.5rem; }
    .modal_botones { display: flex; gap: 1.5rem; margin-top: 2.5rem; }
    .btn_cancelar { flex: 1; padding: 1.2rem 2rem; background: #e0e0e0; color: #333; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_cancelar:hover { background: #bdbdbd; }
    .btn_registrar { flex: 1; padding: 1.2rem 2rem; background: var(--primary-green); color: white; border: none; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; transition: all 0.3s; }
    .btn_registrar:hover { background: #2d8600; }
    .btn_registrar:disabled { opacity: 0.6; cursor: not-allowed; }
  `],
})
export class EggsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eggService = inject(EggInventoryService);
  private eggTypesService = inject(EggTypesService);
  private flocksService = inject(FlocksService);
  private toast = inject(ToastService);
  public permissions = inject(PermissionsService);

  loading = signal(true);
  inventory = signal<EggInventory[]>([]);
  filtered = signal<EggInventory[]>([]);
  eggTypes = signal<EggType[]>([]);
  flocks = signal<Flock[]>([]);
  activeTab = signal<'inventario' | 'danados' | 'historial'>('inventario');
  classifTab = signal<'manual' | 'automatica'>('manual');
  filterType = 'todos';
  searchQuery = '';
  searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 10;

  // History state
  historyPeriod = 'semanal' as 'semanal' | 'mensual' | 'trimestral';
  historyItems = signal<any[]>([]);
  hCurrentPage = 1;
  hTotalPages = 1;
  hTotalItems = 0;

  saving = signal(false);
  totalToday = signal(0);
  showDamagedModal = signal(false);
  selectedInventory = signal<EggInventory | null>(null);

  // Form matching RegisterEggProductionDto: { loteId, tipoHuevoId, cantidad }
  classifyForm = this.fb.group({
    loteId: ['', Validators.required],
    tipoHuevoId: ['', Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  // Form matching RegisterDamagedEggsDto: { inventarioId, cantidad, razon }
  damagedForm = this.fb.group({
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
    razon: ['', Validators.required],
  });

  private typeColors = ['card_azul', 'card_morado', 'card_verde', 'card_verde_claro', 'card_amarillo', 'card_naranja', 'card_rojo'];

  ngOnInit(): void {
    this.loadData();
    this.eggTypesService.getAll().subscribe((t) => this.eggTypes.set(t));
    this.flocksService.getAll().subscribe((f) => this.flocks.set(Array.isArray(f) ? f.filter((fl) => fl.estado === 'ACTIVO') : []));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });
  }

  typeColorClass(index: number): string {
    return this.typeColors[index % this.typeColors.length];
  }

  onTabChange(tab: 'inventario' | 'danados' | 'historial'): void {
    this.activeTab.set(tab);
    if (tab === 'historial') {
      this.loadHistory();
    } else if (tab === 'inventario') {
      this.loadData();
    }
  }

  onHistoryPeriodChange(): void {
    this.hCurrentPage = 1;
    this.loadHistory();
  }

  onHistoryPageChange(page: number): void {
    this.hCurrentPage = page;
    this.loadHistory();
  }

  private loadHistory(): void {
    this.loading.set(true);
    const params: any = { page: this.hCurrentPage, limit: this.limit };
    
    this.eggService.getProductionReport(this.historyPeriod, params).subscribe({
      next: (res) => {
        this.historyItems.set(res.data);
        this.hTotalItems = res.total;
        this.hTotalPages = res.totalPages;
        this.hCurrentPage = res.page;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadData(): void {
    this.loading.set(true);
    // For now we use the inventory paginated method
    const params: any = { page: this.currentPage, limit: this.limit };
    if (this.searchQuery) params.search = this.searchQuery;
    
    this.eggService.getAllPaginated(params).subscribe({
      next: (res: any) => {
        this.inventory.set(res.data);
        this.filtered.set(res.data);
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.totalToday.set(res.data.reduce((s: number, e: any) => s + (e.cantidad || 0), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getCountByType(typeId: string): number {
    return this.inventory().filter((e) => e.tipo_huevo?.id_tipo === typeId).reduce((s, e) => s + (e.cantidad || 0), 0);
  }

  filterInventory(): void {
    // Legacy local filter
    if (this.filterType === 'todos') {
      this.filtered.set(this.inventory());
    } else {
      this.filtered.set(this.inventory().filter((e) => e.tipo_huevo?.tipo === this.filterType));
    }
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  saveProduction(): void {
    if (this.classifyForm.invalid) { this.classifyForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = {
      loteId: this.classifyForm.value.loteId,
      tipoHuevoId: this.classifyForm.value.tipoHuevoId,
      cantidad: Number(this.classifyForm.value.cantidad),
    };
    this.eggService.registerProduction(data).subscribe({
      next: () => {
        this.toast.success('Producción registrada exitosamente');
        this.classifyForm.reset();
        this.loadData();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al registrar producción');
      },
      complete: () => this.saving.set(false),
    });
  }

  openDamagedModal(item: EggInventory): void {
    this.selectedInventory.set(item);
    this.damagedForm.reset();
    this.showDamagedModal.set(true);
  }

  saveDamaged(): void {
    const inv = this.selectedInventory();
    if (!inv || this.damagedForm.invalid) { this.damagedForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = {
      inventarioId: inv.id_inventario_huevo,
      cantidad: Number(this.damagedForm.value.cantidad),
      razon: this.damagedForm.value.razon || 'Dañado',
    };
    this.eggService.registerDamaged(data).subscribe({
      next: () => {
        this.toast.success('Huevos dañados registrados');
        this.showDamagedModal.set(false);
        this.loadData();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al registrar dañados');
      },
      complete: () => this.saving.set(false),
    });
  }
}
