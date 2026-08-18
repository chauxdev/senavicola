import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EggInventoryService, EggTypesService, FlocksService, BarnsService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { EggInventory, EggType, Flock, Barn } from '../../core/models';
import { ModuleHeaderComponent } from '../../shared/components/module-header/module-header.component';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-eggs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent, ModuleHeaderComponent],
  template: `
    <div class="eggs-page">
      <!-- Header del Módulo -->
      <app-module-header 
        title="Gestión de Huevos" 
        description="Administrar y clasificar huevos de manera eficiente." 
        icon="fa-egg">
      </app-module-header>

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
              <div class="form_row" style="grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
                <div class="form_group">
                  <label>Filtrar por Galpón</label>
                  <select (change)="selectedManualBarnId.set($any($event.target).value)">
                    <option value="">Todos los Galpones</option>
                    @for (barn of barns(); track barn.id_galpon) {
                      <option [value]="barn.id_galpon">{{ barn.nombre }} ({{ barn.codigo }})</option>
                    }
                  </select>
                </div>
                <div class="form_group">
                  <label>Seleccionar Lote <span style="color: red">*</span></label>
                  <select formControlName="loteId">
                    <option value="">Seleccionar</option>
                    @for (flock of filteredManualFlocks(); track flock.id_lote) {
                      <option [value]="flock.id_lote">{{ flock.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form_group">
                  <label>Seleccionar Tipo de Huevo <span style="color: red">*</span></label>
                  <select formControlName="tipoHuevoId">
                    <option value="">Seleccionar</option>
                    @for (type of eggTypes(); track type.id_tipo) {
                      <option [value]="type.id_tipo">{{ type.tipo }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form_row" style="grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
                <div class="form_group">
                  <label>Cantidad de huevos <span style="color: red">*</span></label>
                  <input type="number" formControlName="cantidad" placeholder="Ej: 30" min="1" />
                </div>
                <div class="form_group_btn" style="display: flex; align-items: flex-end;">
                  <button type="submit" class="btn_clasificar" [disabled]="saving()" style="width: 100%; height: 45px; justify-content: center;">
                    <i class="fas fa-balance-scale"></i> Clasificar
                  </button>
                </div>
              </div>
            </form>
          } @else {
            <div class="texto_placeholder">No tienes permisos para clasificar huevos.</div>
          }
        }

        @if (classifTab() === 'automatica') {
          <!-- Cards de Estadísticas Duplicadas para Clasificación Automática -->
          <div class="contenedor_cards_huevos" style="margin-top: 1.5rem; margin-bottom: 2rem;">
            <div class="card_stat_huevo" style="padding: 1.2rem 1.5rem;">
              <p class="card_label_huevo" style="font-size: 1.1rem; margin-bottom: 0.2rem;">Total Hoy</p>
              <h3 class="card_valor_huevo card_azul" style="font-size: 2.2rem;">{{ totalToday() }}</h3>
            </div>
            @for (type of eggTypes(); track type.id_tipo) {
              <div class="card_stat_huevo" style="padding: 1.2rem 1.5rem;">
                <p class="card_label_huevo" style="font-size: 1.1rem; margin-bottom: 0.2rem;">{{ type.tipo }}</p>
                <h3 class="card_valor_huevo" [class]="typeColorClass($index)" style="font-size: 2.2rem;">{{ getCountByType(type.id_tipo) }}</h3>
              </div>
            }
          </div>

          <div class="auto-classifier-container" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; margin-top: 2rem;">
            <!-- Panel Izquierdo: Simulación de Cámara -->
            <div class="camera-simulation-panel" style="background: #f8f9fa; border-radius: 12px; padding: 2rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 2rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <h4 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #333;">Vista de Cámara</h4>
                  <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; font-weight: 600;">
                    <span [style.background]="cameraStatus() === 'conectado' ? '#4caf50' : '#f44336'" style="width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                    <span [style.color]="cameraStatus() === 'conectado' ? '#4caf50' : '#f44336'">{{ cameraStatus() | uppercase }}</span>
                  </div>
                </div>
                <select [value]="selectedCamera()" (change)="selectedCamera.set($any($event.target).value)" style="padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 1.3rem;">
                  <option value="camara_1">Cámara 1 (Línea Principal)</option>
                  <option value="camara_2">Cámara 2 (Línea Secundaria)</option>
                </select>
              </div>

              <!-- Camera View Simulator Screen -->
              <div class="camera-screen" style="position: relative; aspect-ratio: 16/9; background: #0f172a; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; color: white;">
                @if (cameraStatus() === 'conectado') {
                  <div style="text-align: center; z-index: 10;">
                    <i class="fas fa-video" style="font-size: 4rem; color: #4caf50; animation: pulse 2s infinite; margin-bottom: 1rem; display: block;"></i>
                    <p style="font-size: 1.3rem; margin: 0; color: #94a3b8;">TRANSMITIENDO EN VIVO</p>
                    @if (lastDetectedWeight()) {
                      <div style="margin-top: 1.5rem; background: rgba(76,175,80,0.25); border: 1px solid #4caf50; padding: 1rem 2rem; border-radius: 6px; font-weight: 700; font-size: 1.6rem; color: #4caf50; backdrop-filter: blur(4px);">
                        Último Peso: {{ lastDetectedWeight() }}g ({{ lastDetectedType() }})
                      </div>
                    }
                  </div>
                  <!-- Simulated Scan Line -->
                  <div style="position: absolute; width: 100%; height: 2px; background: rgba(76,175,80,0.5); top: 0; left: 0; box-shadow: 0 0 10px #4caf50; animation: scan 3s linear infinite;"></div>
                } @else {
                  <div style="text-align: center;">
                    <i class="fas fa-video-slash" style="font-size: 4rem; color: #f44336; margin-bottom: 1rem; display: block;"></i>
                    <p style="font-size: 1.4rem; color: #94a3b8;">SIN SEÑAL DE CÁMARA</p>
                  </div>
                }
              </div>

              <div style="display: flex; gap: 1.5rem;">
                <button type="button" class="btn-green" [disabled]="permissions.isVisitor()" (click)="cameraStatus.set(cameraStatus() === 'conectado' ? 'desconectado' : 'conectado')" style="flex: 1; padding: 1rem; font-size: 1.3rem; font-weight: 600; border-radius: 6px; cursor: pointer; justify-content: center; display: flex; align-items: center; gap: 0.5rem;">
                  <i class="fas" [class.fa-plug]="cameraStatus() !== 'conectado'" [class.fa-power-off]="cameraStatus() === 'conectado'"></i>
                  {{ cameraStatus() === 'conectado' ? 'Desconectar Cámara' : 'Conectar Cámara' }}
                </button>
              </div>
            </div>

            <!-- Panel Derecho: Parámetros y Acciones -->
            <div class="camera-actions-panel" style="display: flex; flex-direction: column; gap: 2rem;">
              <h4 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #333; display: flex; align-items: center; gap: 0.8rem;">
                <i class="fas fa-cogs" style="color: var(--primary-green);"></i> Parámetros de Clasificación
              </h4>

              <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="form_group">
                  <label>Galpón origen</label>
                  <select (change)="selectedAutoBarnId.set($any($event.target).value)">
                    <option value="">Todos los Galpones</option>
                    @for (barn of barns(); track barn.id_galpon) {
                      <option [value]="barn.id_galpon">{{ barn.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form_group">
                  <label>Lote destino</label>
                  <select [value]="selectedAutoLoteId()" (change)="selectedAutoLoteId.set($any($event.target).value)">
                    <option value="">Seleccionar Lote</option>
                    @for (flock of filteredAutoFlocks(); track flock.id_lote) {
                      <option [value]="flock.id_lote">{{ flock.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="form_group">
                  <label>Cantidad por ciclo</label>
                  <input type="number" [value]="autoQuantity()" (input)="autoQuantity.set($any($event.target).value)" min="1" max="100" />
                </div>

                <button type="button" class="btn-green" [disabled]="saving() || !selectedAutoLoteId() || cameraStatus() !== 'conectado' || permissions.isVisitor()" (click)="simulateAutoClassification()" style="width: 100%; padding: 1.5rem; font-size: 1.5rem; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; box-shadow: 0 4px 6px rgba(57,169,0,0.2); justify-content: center;">
                  <i class="fas fa-camera"></i> Capturar Peso / Clasificar
                </button>
              </div>
            </div>
          </div>

          <!-- Tablas de Historial y Dañados para Clasificación Automática -->
          <div class="auto-classifier-tables" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 4rem; border-top: 1px solid #e2e8f0; padding-top: 3rem;">
            <div>
              <h4 style="margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; color: #333; display: flex; align-items: center; gap: 0.8rem;">
                <i class="fas fa-history" style="color: var(--primary-green);"></i> Clasificaciones Recientes (Hoy)
              </h4>
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr><th style="width: 50px;">#</th><th>Fecha/Hora</th><th>Lote</th><th>Tipo</th><th>Cant.</th></tr>
                  </thead>
                  <tbody>
                    @for (item of historyItems().slice(0, 5); track item.id_produccion_huevo; let idx = $index) {
                      <tr>
                        <td><strong>{{ idx + 1 }}</strong></td>
                        <td>{{ item.produccionFecha | date:'shortTime' }}</td>
                        <td>{{ item.lote?.nombre || '—' }}</td>
                        <td><span class="badge_estado disponible">{{ item.tipo_huevo?.tipo || '—' }}</span></td>
                        <td><strong>{{ item.cantidady }}</strong></td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" style="text-align: center; color: #666; padding: 2rem;">No hay clasificaciones registradas hoy.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style="margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; color: #333; display: flex; align-items: center; gap: 0.8rem;">
                <i class="fas fa-exclamation-circle" style="color: #f44336;"></i> Huevos Dañados Recientes
              </h4>
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr><th style="width: 50px;">#</th><th>Lote</th><th>Tipo</th><th>Cant.</th><th>Razón</th></tr>
                  </thead>
                  <tbody>
                    @for (item of damagedItems().slice(0, 5); track $index; let idx = $index) {
                      <tr>
                        <td><strong>{{ idx + 1 }}</strong></td>
                        <td>{{ item.inventario?.lote?.nombre || '—' }}</td>
                        <td><span class="badge_estado disponible">{{ item.inventario?.tipo_huevo?.tipo || '—' }}</span></td>
                        <td><strong style="color: #f44336;">{{ item.cantidad }}</strong></td>
                        <td>{{ item.razon || '—' }}</td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" style="text-align: center; color: #666; padding: 2rem;">No hay huevos dañados registrados.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
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
            <div class="controles_tabla" style="gap: 1rem; display: flex; align-items: center; justify-content: flex-start; margin-bottom: 2rem;">
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
                    <tr>
                      <th style="width: 60px;">#</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Peso Promedio</th>
                      <th>Fecha de Registro</th>
                      <th>Lote</th>
                      <th>Galpón</th>
                      @if (permissions.canWrite()) {
                        <th style="text-align: right; width: 150px;">Acciones</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of filtered(); track item.id_inventario_huevo; let idx = $index) {
                      <tr>
                        <td><strong>{{ (currentPage - 1) * limit + idx + 1 }}</strong></td>
                        <td><span class="badge_estado disponible">{{ item.tipo_huevo?.tipo || '—' }}</span></td>
                        <td><strong>{{ item.cantidad }}</strong></td>
                        <td>{{ getAverageWeight(item) }}</td>
                        <td>{{ (item.produccion?.produccionFecha | date:'dd/MM/yyyy HH:mm') || '—' }}</td>
                        <td>{{ item.lote?.nombre || '—' }}</td>
                        <td>{{ item.lote?.ubicacion?.[0]?.galpon?.nombre || '—' }}</td>
                        @if (permissions.canWrite()) {
                          <td style="text-align: right; white-space: nowrap;">
                            <button class="btn-icon edit" title="Editar" (click)="openEditModal(item)" style="margin-right: 0.5rem;">
                              <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon delete" title="Dejar Dañados" (click)="openDamagedModal(item)" style="margin-right: 0.5rem; color: #ff9800; background: rgba(255,152,0,0.1);">
                              <i class="fas fa-exclamation-triangle"></i>
                            </button>
                            <button class="btn-icon delete" title="Eliminar" (click)="deleteInventory(item)">
                              <i class="fas fa-trash-alt"></i>
                            </button>
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
          }

          @if (activeTab() === 'danados') {
            <div class="controles_tabla" style="gap: 1rem; display: flex; align-items: center; justify-content: flex-start; margin-bottom: 2rem;">
              <select class="select_filtro" [(ngModel)]="damagedFilterType" (change)="onDamagedFilterChange()">
                <option value="todos">Todos los tipos</option>
                @for (type of eggTypes(); track type.id_tipo) {
                  <option [value]="type.tipo">{{ type.tipo }}</option>
                }
              </select>
              <div class="search-bar" style="display: flex; align-items: center; border: 2px solid #e0e0e0; border-radius: 8px; padding: 0 1rem; background: white;">
                <i class="fas fa-search" style="color: #666; margin-right: 0.5rem;"></i>
                <input type="text" placeholder="Buscar lote..." style="border: none; outline: none; padding: 1.2rem 0; font-size: 1.5rem; width: 250px;" [(ngModel)]="damagedSearchQuery" (input)="onDamagedSearchInput()" />
              </div>
            </div>
            @if (loading()) {
              <div class="loading-container"><div class="spinner"></div></div>
            } @else if (damagedItems().length === 0) {
              <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No hay huevos dañados registrados</h3>
                <p>Usa la opción "Dañados" en la tabla de inventario disponible</p>
              </div>
            } @else {
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr><th style="width: 60px;">#</th><th>Fecha</th><th>Lote</th><th>Tipo Huevo</th><th>Cantidad Dañada</th><th>Razón</th></tr>
                  </thead>
                  <tbody>
                    @for (item of damagedItems(); track $index; let idx = $index) {
                      <tr>
                        <td><strong>{{ (dCurrentPage - 1) * limit + idx + 1 }}</strong></td>
                        <td>{{ item.registeredAt | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>{{ item.inventario?.lote?.nombre || '—' }}</td>
                        <td><span class="badge_estado disponible">{{ item.inventario?.tipo_huevo?.tipo || '—' }}</span></td>
                        <td><strong style="color: #f44336;">{{ item.cantidad }}</strong></td>
                        <td>{{ item.razon || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <app-pagination 
                [currentPage]="dCurrentPage" 
                [totalPages]="dTotalPages" 
                [totalItems]="dTotalItems"
                (pageChange)="onDamagedPageChange($event)">
              </app-pagination>
            }
          }
          @if (activeTab() === 'historial') {
            <div class="controles_tabla" style="gap: 1rem; display: flex; align-items: center; justify-content: flex-start; margin-bottom: 2rem;">
              <div class="search-bar" style="display: flex; align-items: center; border: 2px solid #e0e0e0; border-radius: 8px; padding: 0 1rem; background: white;">
                <i class="fas fa-search" style="color: #666; margin-right: 0.5rem;"></i>
                <input type="text" placeholder="Buscar lote o tipo..." style="border: none; outline: none; padding: 1.2rem 0; font-size: 1.5rem; width: 250px;" [(ngModel)]="historySearchQuery" (input)="onHistorySearchInput()" />
              </div>
            </div>
            @if (loading()) {
              <div class="loading-container"><div class="spinner"></div></div>
            } @else if (historyItems().length === 0) {
              <div class="empty-state">
                <i class="fas fa-history"></i>
                <h3>No hay registros de historial</h3>
                <p>Los movimientos (nuevos registros, actualizaciones, huevos dañados) aparecerán aquí.</p>
              </div>
            } @else {
              <div class="tabla_contenedor">
                <table class="tabla">
                  <thead>
                    <tr>
                      <th style="width: 60px;">#</th>
                      <th>Fecha</th>
                      <th>Tipo Movimiento</th>
                      <th>Lote</th>
                      <th>Tipo Huevo</th>
                      <th>Cant. Anterior</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of historyItems(); track item.id_historial_huevo; let idx = $index) {
                      <tr>
                        <td><strong>{{ (hCurrentPage - 1) * limit + idx + 1 }}</strong></td>
                        <td>{{ item.fecha | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                          <span class="badge_estado"
                            [style.background]="item.tipoMovimiento === 'Huevos Dañados' ? 'rgba(244,67,54,0.12)' : item.tipoMovimiento === 'Actualización' ? 'rgba(33,150,243,0.12)' : 'rgba(76,175,80,0.12)'"
                            [style.color]="item.tipoMovimiento === 'Huevos Dañados' ? '#f44336' : item.tipoMovimiento === 'Actualización' ? '#1976d2' : '#2e7d32'">
                            <i class="fas"
                              [class.fa-exclamation-triangle]="item.tipoMovimiento === 'Huevos Dañados'"
                              [class.fa-edit]="item.tipoMovimiento === 'Actualización'"
                              [class.fa-plus-circle]="!item.tipoMovimiento || item.tipoMovimiento === 'Nuevo Registro'"
                              style="margin-right: 0.4rem;"></i>
                            {{ item.tipoMovimiento || 'Nuevo Registro' }}
                          </span>
                        </td>
                        <td>{{ item.inventario?.lote?.nombre || '—' }}</td>
                        <td>{{ item.inventario?.tipo_huevo?.tipo || '—' }}</td>
                        <td>{{ item.cantidadAnterior !== null && item.cantidadAnterior !== undefined ? item.cantidadAnterior : '—' }}</td>
                        <td><strong>{{ item.cantidad }}</strong></td>
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

    <!-- Modal Editar -->
    @if (showEditModal()) {
      <div class="modal-overlay" (click)="showEditModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-edit text-primary"></i> Editar Registro de Huevos</h3>
            <button class="btn-close" (click)="showEditModal.set(false)"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <div class="form-group">
                <label>Seleccionar Lote <span style="color: red">*</span></label>
                <select formControlName="loteId" [attr.disabled]="permissions.isVisitor() ? true : null">
                  <option value="">Seleccionar</option>
                  @for (flock of flocks(); track flock.id_lote) {
                    <option [value]="flock.id_lote">{{ flock.nombre }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Seleccionar Tipo de Huevo <span style="color: red">*</span></label>
                <select formControlName="tipoHuevoId" [attr.disabled]="permissions.isVisitor() ? true : null">
                  <option value="">Seleccionar</option>
                  @for (type of eggTypes(); track type.id_tipo) {
                    <option [value]="type.id_tipo">{{ type.tipo }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Cantidad <span style="color: red">*</span></label>
                <input type="number" formControlName="cantidad" placeholder="Ej: 30" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="showEditModal.set(false)">Cancelar</button>
            @if (permissions.canWrite()) {
              <button type="submit" class="btn-green" (click)="saveEdit()" [disabled]="saving()">Guardar</button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Dañados -->
    @if (showDamagedModal()) {
      <div class="modal-overlay" (click)="showDamagedModal.set(false)">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-exclamation-triangle text-danger"></i> Registrar Huevos Dañados</h3>
            <button class="btn-close" (click)="showDamagedModal.set(false)"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="damagedForm" (ngSubmit)="saveDamaged()">
              <div class="form-group">
                <label>Cantidad Disponible</label>
                <input type="number" [value]="selectedInventory()?.cantidad || 0" readonly class="input-disabled" />
              </div>
              <div class="form-group">
                <label>Cantidad Dañada <span style="color: red">*</span></label>
                <input type="number" formControlName="cantidad" placeholder="Ej: 5" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
              <div class="form-group">
                <label>Razón <span style="color: red">*</span></label>
                <input type="text" formControlName="razon" placeholder="Ej: Rotos en transporte" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-outline" (click)="showDamagedModal.set(false)">Cancelar</button>
            @if (permissions.canWrite()) {
              <button type="submit" class="btn-green" (click)="saveDamaged()" [disabled]="saving()">Actualizar</button>
            }
          </div>
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
    .btn_clasificar { background: var(--primary-green); color: white; border: none; padding: 1.2rem 2.5rem; border-radius: 8px; font-size: 1.5rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.8rem; transition: all 0.3s; }
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
    .texto_placeholder { text-align: center; padding: 5rem; font-size: 1.8rem; color: #666; }

    @keyframes scan {
      0% { top: 0; }
      50% { top: 100%; }
      100% { top: 0; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `],
})
export class EggsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eggService = inject(EggInventoryService);
  private eggTypesService = inject(EggTypesService);
  private flocksService = inject(FlocksService);
  private barnsService = inject(BarnsService);
  private toast = inject(ToastService);
  public permissions = inject(PermissionsService);
  private refreshService = inject(DashboardRefreshService);
  private confirmService = inject(ConfirmService);

  loading = signal(true);
  inventory = signal<EggInventory[]>([]);
  statsInventory = signal<EggInventory[]>([]);
  filtered = signal<EggInventory[]>([]);
  eggTypes = signal<EggType[]>([]);
  flocks = signal<Flock[]>([]);
  barns = signal<Barn[]>([]);
  selectedManualBarnId = signal<string>('');
  selectedAutoBarnId = signal<string>('');
  selectedCamera = signal<string>('camara_1');
  cameraStatus = signal<'conectado' | 'desconectado'>('conectado');
  lastDetectedWeight = signal<number | null>(null);
  lastDetectedType = signal<string>('');
  selectedAutoLoteId = signal<string>('');
  autoQuantity = signal<number>(1);

  filteredManualFlocks = computed(() => {
    const barnId = this.selectedManualBarnId();
    if (!barnId) return this.flocks();
    return this.flocks().filter(f => f.ubicacion?.[0]?.galpon?.id_galpon === barnId);
  });

  filteredAutoFlocks = computed(() => {
    const barnId = this.selectedAutoBarnId();
    if (!barnId) return this.flocks();
    return this.flocks().filter(f => f.ubicacion?.[0]?.galpon?.id_galpon === barnId);
  });

  activeTab = signal<'inventario' | 'danados' | 'historial'>('inventario');
  classifTab = signal<'manual' | 'automatica'>('manual');
  filterType = 'todos';
  searchQuery = '';
  searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 5;

  // History state
  historyPeriod = 'semanal' as 'semanal' | 'mensual' | 'trimestral';
  historyItems = signal<any[]>([]);
  hCurrentPage = 1;
  hTotalPages = 1;
  hTotalItems = 0;
  historySearchQuery = '';
  historySearchSubject = new Subject<string>();

  // Damaged state
  damagedItems = signal<any[]>([]);
  dCurrentPage = 1;
  dTotalPages = 1;
  dTotalItems = 0;
  damagedFilterType = 'todos';
  damagedSearchQuery = '';
  damagedSearchSubject = new Subject<string>();

  saving = signal(false);
  totalToday = signal(0);
  showDamagedModal = signal(false);
  showEditModal = signal(false);
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

  // Form matching UpdateEggInventoryDto
  editForm = this.fb.group({
    loteId: ['', Validators.required],
    tipoHuevoId: ['', Validators.required],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  private typeColors = ['card_azul', 'card_morado', 'card_verde', 'card_verde_claro', 'card_amarillo', 'card_naranja', 'card_rojo'];

  ngOnInit(): void {
    this.loadData();
    this.loadHistory();
    this.loadDamagedData();
    this.eggTypesService.getAll().subscribe((t) => this.eggTypes.set(t));
    this.flocksService.getAll().subscribe((f) => this.flocks.set(Array.isArray(f) ? f.filter((fl) => fl.estado === 'ACTIVO') : []));
    this.barnsService.getAll().subscribe((b) => this.barns.set(Array.isArray(b) ? b : []));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadData();
    });

    this.damagedSearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.dCurrentPage = 1;
      this.loadDamagedData();
    });

    this.historySearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.hCurrentPage = 1;
      this.loadHistory();
    });
  }

  typeColorClass(index: number): string {
    return this.typeColors[index % this.typeColors.length];
  }

  onTabChange(tab: 'inventario' | 'danados' | 'historial'): void {
    this.activeTab.set(tab);
    if (tab === 'historial') {
      this.loadHistory();
    } else if (tab === 'danados') {
      this.loadDamagedData();
    } else if (tab === 'inventario') {
      this.loadData();
    }
  }

  onDamagedPageChange(page: number): void {
    this.dCurrentPage = page;
    this.loadDamagedData();
  }

  loadDamagedData(): void {
    this.loading.set(true);
    const params: any = { page: this.dCurrentPage, limit: this.limit };
    if (this.damagedSearchQuery) params.search = this.damagedSearchQuery;
    if (this.damagedFilterType && this.damagedFilterType !== 'todos') params.tipo = this.damagedFilterType;

    this.eggService.getDamagedPaginated(params).subscribe({
      next: (res: any) => {
        this.damagedItems.set(res.data);
        this.dTotalItems = res.total;
        this.dTotalPages = res.totalPages;
        this.dCurrentPage = res.page;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
    if (this.historySearchQuery) params.search = this.historySearchQuery;
    
    this.eggService.getEggHistory(params).subscribe({
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
    const params: any = { page: this.currentPage, limit: this.limit };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.filterType && this.filterType !== 'todos') params.tipo = this.filterType;
    
    this.eggService.getAllPaginated(params).subscribe({
      next: (res: any) => {
        this.inventory.set(res.data);
        this.filtered.set(res.data);
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Fetch full inventory for stats calculation (non-paginated)
    this.eggService.getAll({ limit: 1000 }).subscribe({
      next: (data: any[]) => {
        this.statsInventory.set(data);
        this.totalToday.set(data.reduce((s: number, e: any) => s + (e.cantidad || 0), 0));
      }
    });
  }

  getCountByType(typeId: string): number {
    return this.statsInventory().filter((e) => e.tipo_huevo?.id_tipo === typeId).reduce((s, e) => s + (e.cantidad || 0), 0);
  }

  filterInventory(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onDamagedSearchInput(): void {
    this.damagedSearchSubject.next(this.damagedSearchQuery);
  }

  onHistorySearchInput(): void {
    this.historySearchSubject.next(this.historySearchQuery);
  }

  onDamagedFilterChange(): void {
    this.dCurrentPage = 1;
    this.loadDamagedData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  getAverageWeight(item: EggInventory): string {
    const type = item.tipo_huevo;
    if (!type) return '—';
    const min = type.peso_min;
    const max = type.peso_max;
    if (min !== undefined && max !== undefined && min !== null && max !== null) {
      return `${((Number(min) + Number(max)) / 2).toFixed(1)} g`;
    }
    if (min !== undefined && min !== null) {
      return `> ${min} g`;
    }
    if (max !== undefined && max !== null) {
      return `< ${max} g`;
    }
    return '—';
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
        this.refreshService.notifyDataChanged();
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

  openEditModal(item: EggInventory): void {
    this.selectedInventory.set(item);
    this.editForm.setValue({
      loteId: item.lote?.id_lote || '',
      tipoHuevoId: item.tipo_huevo?.id_tipo || '',
      cantidad: item.cantidad
    });
    this.showEditModal.set(true);
  }

  saveEdit(): void {
    const inv = this.selectedInventory();
    if (!inv || this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = {
      loteId: this.editForm.value.loteId,
      tipoHuevoId: this.editForm.value.tipoHuevoId,
      cantidad: Number(this.editForm.value.cantidad),
    };
    this.eggService.update(inv.id_inventario_huevo, data).subscribe({
      next: () => {
        this.toast.success('Registro de inventario actualizado exitosamente');
        this.showEditModal.set(false);
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al actualizar registro');
      },
      complete: () => this.saving.set(false),
    });
  }

  async deleteInventory(item: EggInventory) {
    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar este registro de inventario de huevos? Esta acción no se puede deshacer.`
    });

    if (!confirmed) return;

    this.loading.set(true);
    this.eggService.delete(item.id_inventario_huevo).subscribe({
      next: () => {
        this.toast.success('Registro de inventario eliminado exitosamente');
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al eliminar el registro');
      }
    });
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
        this.loadDamagedData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al registrar dañados');
      },
      complete: () => this.saving.set(false),
    });
  }

  simulateAutoClassification(): void {
    if (!this.selectedAutoLoteId()) {
      this.toast.error('Debe seleccionar un lote para clasificar');
      return;
    }
    if (this.cameraStatus() !== 'conectado') {
      this.toast.error('La cámara seleccionada está desconectada');
      return;
    }

    this.saving.set(true);

    // Simulate weight between 30g and 80g
    const weight = Math.floor(Math.random() * 50) + 30;
    this.lastDetectedWeight.set(weight);

    // Determine type:
    // Jumbo: > 73g
    // AAA: 63-73g
    // AA: 53-63g
    // A: 43-53g
    // B: 33-43g
    // C: < 33g
    let typeName = 'C';
    if (weight > 73) typeName = 'Jumbo';
    else if (weight >= 63) typeName = 'AAA';
    else if (weight >= 53) typeName = 'AA';
    else if (weight >= 43) typeName = 'A';
    else if (weight >= 33) typeName = 'B';

    this.lastDetectedType.set(typeName);

    const matchingType = this.eggTypes().find(t => t.tipo.toLowerCase() === typeName.toLowerCase());
    if (!matchingType) {
      this.toast.error(`Tipo de huevo "${typeName}" no configurado en el sistema`);
      this.saving.set(false);
      return;
    }

    const payload = {
      loteId: this.selectedAutoLoteId(),
      tipoHuevoId: matchingType.id_tipo,
      cantidad: this.autoQuantity() || 1
    };

    this.eggService.registerProduction(payload).subscribe({
      next: () => {
        this.toast.success(`Capturado: ${weight}g (${typeName}). Registrado exitosamente.`);
        this.loadData();
        this.loadHistory();
        this.loadDamagedData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al registrar la producción automática');
      },
      complete: () => this.saving.set(false)
    });
  }
}
