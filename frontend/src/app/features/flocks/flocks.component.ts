import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { FlocksService, BarnsService, BreedsService } from '../../core/services/api.services';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ToastService } from '../../core/services/toast.service';
import { PermissionsService } from '../../core/services/permissions.service';
import { Flock, Barn, Breed } from '../../core/models';
import { ModuleHeaderComponent } from '../../shared/components/module-header/module-header.component';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-flocks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent, ModuleHeaderComponent],
  template: `
    <div class="flocks-page">
      <!-- Module Header -->
      <app-module-header 
        title="Gestión de Gallinas por Galpón" 
        description="Registra lotes, galpones y controla tus gallinas fácilmente." 
        icon="fa-dove">
        @if (permissions.canWrite()) {
          <button class="btn-green" (click)="openModal('flock')">
            <i class="fas fa-plus"></i> Registrar Lote
          </button>
          <button class="btn-outline" (click)="openModal('barn')">
            <i class="fas fa-plus"></i> Registrar Galpón
          </button>
        }
      </app-module-header>

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
        <button class="tab-btn" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history'); loadHistory()">
          <i class="fas fa-history"></i> Historial de Asignaciones
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
                    <th style="width: 60px;">#</th>
                    <th>Nombre</th>
                    <th>Total Aves</th>
                    <th>Estado</th>
                    <th>Raza</th>
                    <th>Galpón</th>
                    <th>Fecha Llegada</th>
                    <th style="text-align: right; width: 140px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (flock of filteredFlocks(); track flock.id_lote; let idx = $index) {
                    <tr>
                      <td><strong>{{ (currentPage - 1) * limit + idx + 1 }}</strong></td>
                      <td><strong>{{ flock.nombre }}</strong></td>
                      <td>{{ flock.total_aves | number }}</td>
                      <td>
                        <span class="badge {{ flock.estado === 'ACTIVO' || flock.estado === 'activo' ? 'active' : 'finished' }}">
                          {{ flock.estado || 'ACTIVO' }}
                        </span>
                      </td>
                      <td>{{ flock.raza?.nombre || '—' }}</td>
                      <td>{{ flock.ubicacion?.[0]?.galpon?.nombre || '—' }}</td>
                      <td>{{ flock.ubicacion?.[0]?.Fecha ? (flock.ubicacion?.[0]?.Fecha | date:'dd/MM/yyyy') : '—' }}</td>
                      <td class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn-icon view" title="Ver Detalles" (click)="openDetailsModal(flock)">
                          <i class="fas fa-eye"></i>
                        </button>
                        @if (permissions.canWrite()) {
                          <button class="btn-icon edit" title="Editar Lote" (click)="openEditFlockModal(flock)">
                            <i class="fas fa-edit"></i>
                          </button>
                          @if (flock.estado === 'ACTIVO' || flock.estado === 'activo') {
                            <button class="btn-icon" style="color:#e74c3c;border-color:#e74c3c" title="Registrar Aves Muertas" (click)="openDeadBirdsModal(flock)">
                              <i class="fas fa-skull-crossbones"></i>
                            </button>
                            <button class="btn-icon view" title="Finalizar Lote" (click)="finalizeFlock(flock)">
                              <i class="fas fa-flag-checkered"></i>
                            </button>
                          }
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
        </div>
      }

      <!-- Barns Table -->
      @if (activeTab() === 'barns') {
        <div class="table-container">
          <div class="table-header">
            <h3>Listado de Galpones</h3>
            <div class="table-actions">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar por nombre o código..." [(ngModel)]="barnSearchQuery" (input)="onBarnSearchInput()" />
              </div>
            </div>
          </div>
          @if (filteredBarns().length === 0) {
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
                    <th style="width: 60px;">#</th><th>Código</th><th>Nombre</th><th>Capacidad</th><th>Área (m²)</th><th>Unidad</th>
                    @if (permissions.canWrite()) {
                      <th style="text-align: right; width: 120px;">Acciones</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (barn of pagedBarns; track barn.id_galpon; let idx = $index) {
                    <tr>
                      <td><strong>{{ (barnsPage - 1) * barnsLimit + idx + 1 }}</strong></td>
                      <td>{{ barn.codigo }}</td>
                      <td><strong>{{ barn.nombre }}</strong></td>
                      <td>{{ barn.capacidad_max_aves || '—' }}</td>
                      <td>{{ barn.area || '—' }} m²</td>
                      <td>{{ barn.unidadMedida?.nombre || '—' }}</td>
                      @if (permissions.canWrite()) {
                        <td class="actions-cell" style="justify-content: flex-end;">
                          <button class="btn-icon edit" (click)="editBarn(barn)"><i class="fas fa-edit"></i></button>
                          <button class="btn-icon delete" (click)="deleteBarn(barn.id_galpon)"><i class="fas fa-trash"></i></button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pagination
              [currentPage]="barnsPage"
              [totalPages]="barnsTotalPages"
              [totalItems]="filteredBarns().length"
              (pageChange)="onBarnsPageChange($event)">
            </app-pagination>
          }
        </div>
      }

      <!-- History Tab -->
      @if (activeTab() === 'history') {
        <div class="table-container">
          <div class="table-header">
            <h3>Historial de Asignaciones</h3>
            <div class="table-actions">
              <div class="search-bar">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Buscar en historial..." [(ngModel)]="historySearch" (input)="onHistorySearchInput()" />
              </div>
            </div>
          </div>
          @if (loadingHistory()) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else if (historyItems().length === 0) {
            <div class="empty-state">
              <i class="fas fa-history"></i>
              <h3>No hay registros de historial</h3>
              <p>Las acciones sobre lotes aparecerán aquí</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width:60px">#</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Acción</th>
                    <th>Lote</th>
                    <th>Aves</th>
                    <th>Raza</th>
                    <th>Galpón</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of historyItems(); track item.id_historial_asignacion_lote; let idx = $index) {
                    <tr>
                      <td><strong>{{ (historyPage - 1) * 5 + idx + 1 }}</strong></td>
                      <td>{{ item.fecha | date:'dd/MM/yyyy' }}</td>
                      <td>{{ item.fecha | date:'HH:mm' }}</td>
                      <td>{{ item.descripcion || '—' }}</td>
                      <td>{{ item.nombre_elemento || item.lote?.nombre || '—' }}</td>
                      <td>{{ item.cantidad_asignada | number }}</td>
                      <td>{{ item.raza_nombre || '—' }}</td>
                      <td>{{ item.galpon?.nombre || '—' }}</td>
                      <td>{{ item.usuario || 'Sistema' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pagination
              [currentPage]="historyPage"
              [totalPages]="historyTotalPages"
              [totalItems]="historyTotal"
              (pageChange)="onHistoryPageChange($event)">
            </app-pagination>
          }
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
                  <input type="text" formControlName="nombre" placeholder="Ej: Lote A-2026" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-dove"></i> Total de Aves</label>
                  <input type="number" formControlName="total_aves" placeholder="Ej: 500" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-dna"></i> Raza</label>
                  <select formControlName="razaId" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="">Seleccionar raza</option>
                    @for (breed of breeds(); track breed.id_raza) {
                      <option [value]="breed.id_raza">{{ breed.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Galpón</label>
                  <select formControlName="galponId" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="">Seleccionar galpón</option>
                    @for (barn of barns(); track barn.id_galpon) {
                      <option [value]="barn.id_galpon">{{ barn.nombre }} (Cap: {{ barn.capacidad_max_aves }})</option>
                    }
                  </select>
                  <!-- Capacity indicator -->
                  @if (barnCapacityInfo(); as info) {
                    <div class="capacity-indicator" [class.cap-ok]="info.status === 'ok'" [class.cap-warn]="info.status === 'warn'" [class.cap-full]="info.status === 'full'">
                      <i class="fas" [class.fa-check-circle]="info.status === 'ok'" [class.fa-exclamation-triangle]="info.status === 'warn'" [class.fa-times-circle]="info.status === 'full'"></i>
                      <span>{{ info.message }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-utensils"></i> Ración de Alimento</label>
                  <input type="text" formControlName="racion_alimento" placeholder="Ej: 120g/día" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Observación</label>
                <textarea formControlName="observacion" placeholder="Observaciones..." rows="2" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="saveFlock()" [disabled]="savingFlock()">
                @if (savingFlock()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
                Guardar Lote
              </button>
            }
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
                  <input type="text" formControlName="codigo" placeholder="Ej: G-001" [readonly]="permissions.isVisitor() || editingBarn() !== null" [class.input-disabled]="permissions.isVisitor() || editingBarn() !== null" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Nombre del Galpón</label>
                  <input type="text" formControlName="nombre" placeholder="Ej: Galpón 1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-users"></i> Capacidad Máx. Aves</label>
                  <input type="number" formControlName="capacidad_max_aves" placeholder="Ej: 500" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-ruler-combined"></i> Área (m²)</label>
                  <input type="number" formControlName="area" placeholder="Ej: 120.5" min="0.1" step="0.1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="saveBarn()" [disabled]="savingBarn()">
                @if (savingBarn()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
                {{ editingBarn() ? 'Actualizar' : 'Guardar' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Editar Lote -->
    @if (showEditFlockModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-edit"></i> Editar Lote</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="editFlockForm">
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-tag"></i> Nombre del Lote</label>
                  <input type="text" formControlName="nombre" placeholder="Nombre del lote" [readonly]="true" [class.input-disabled]="true" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-dove"></i> Total de Aves</label>
                  <input type="number" formControlName="total_aves" placeholder="Total aves" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-dna"></i> Raza</label>
                  <select formControlName="razaId" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="">Seleccionar raza</option>
                    @for (breed of breeds(); track breed.id_raza) {
                      <option [value]="breed.id_raza">{{ breed.nombre }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label><i class="fas fa-warehouse"></i> Galpón</label>
                  <select formControlName="galponId" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="">Seleccionar galpón</option>
                    @for (barn of barns(); track barn.id_galpon) {
                      <option [value]="barn.id_galpon">{{ barn.nombre }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-utensils"></i> Ración de Alimento</label>
                  <input type="text" formControlName="racion_alimento" placeholder="Ej: 120g/día" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-toggle-on"></i> Estado</label>
                  <select formControlName="estado" [attr.disabled]="permissions.isVisitor() ? true : null">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Observación</label>
                <textarea formControlName="observacion" placeholder="Observaciones..." rows="2" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="saveEditFlock()" [disabled]="savingEditFlock()">
                @if (savingEditFlock()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
                Guardar Cambios
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Detalles de Lote -->
    @if (showDetailsModal() && selectedFlock()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-dove"></i> {{ selectedFlock()!.nombre }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <!-- Info Card -->
            <div class="details-card">
              <h4><i class="fas fa-info-circle"></i> Información General</h4>
              <div class="details-grid">
                <div class="detail-item"><span class="detail-label">ID Interno</span><span class="detail-value">{{ selectedFlock()!.id_lote }}</span></div>
                <div class="detail-item"><span class="detail-label">Nombre</span><span class="detail-value">{{ selectedFlock()!.nombre }}</span></div>
                <div class="detail-item"><span class="detail-label">Total Aves</span><span class="detail-value">{{ selectedFlock()!.total_aves | number }}</span></div>
                <div class="detail-item"><span class="detail-label">Estado</span><span class="detail-value"><span class="badge {{ selectedFlock()!.estado === 'ACTIVO' ? 'active' : 'finished' }}">{{ selectedFlock()!.estado }}</span></span></div>
                <div class="detail-item"><span class="detail-label">Raza</span><span class="detail-value">{{ selectedFlock()!.raza?.nombre || '—' }}</span></div>
                <div class="detail-item"><span class="detail-label">Galpón Asignado</span><span class="detail-value">{{ selectedFlock()!.ubicacion?.[0]?.galpon?.nombre || '—' }}</span></div>
                <div class="detail-item" style="grid-column: 1/-1"><span class="detail-label">Observaciones</span><span class="detail-value">{{ selectedFlock()!.observacion || '—' }}</span></div>
                <div class="detail-item"><span class="detail-label">Fecha Llegada</span><span class="detail-value">{{ (selectedFlock()!.ubicacion?.[0]?.Fecha ? (selectedFlock()!.ubicacion?.[0]?.Fecha | date:'dd/MM/yyyy HH:mm') : '—') }}</span></div>
              </div>
            </div>
            <!-- Assignment History -->
            <div class="history-section">
              <h4><i class="fas fa-history"></i> Historial de Asignaciones</h4>
              @if (loadingHistory()) {
                <div class="loading-container"><div class="spinner"></div></div>
              } @else if (detailsHistory().length === 0) {
                <p style="color:var(--gray-dark);font-size:1.3rem;text-align:center;padding:1.5rem">Sin registros de historial</p>
              } @else {
                <div class="table-responsive">
                  <table class="data-table">
                    <thead><tr>
                      <th>#</th><th>Fecha</th><th>Hora</th><th>Acción</th><th>Aves</th><th>Galpón</th><th>Usuario</th>
                    </tr></thead>
                    <tbody>
                      @for (h of pagedDetailsHistory; track h.id_historial_asignacion_lote; let hi = $index) {
                        <tr>
                          <td>{{ (detailsHistoryPage - 1) * detailsHistoryLimit + hi + 1 }}</td>
                          <td>{{ h.fecha | date:'dd/MM/yyyy' }}</td>
                          <td>{{ h.fecha | date:'HH:mm' }}</td>
                          <td>{{ h.descripcion || '—' }}</td>
                          <td>{{ h.cantidad_asignada | number }}</td>
                          <td>{{ h.galpon?.nombre || '—' }}</td>
                          <td>{{ h.usuario || 'Sistema' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                <app-pagination
                  [currentPage]="detailsHistoryPage"
                  [totalPages]="detailsHistoryTotalPages"
                  [totalItems]="detailsHistory().length"
                  (pageChange)="onDetailsHistoryPageChange($event)">
                </app-pagination>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cerrar</button>
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
                <input type="text" [value]="selectedFlock()?.nombre || 'Lote ' + selectedFlock()?.id_lote?.substring(0, 8)" disabled class="input-disabled" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-skull-crossbones"></i> Cantidad</label>
                  <input type="number" formControlName="cantidad" placeholder="Cantidad de aves muertas" min="1" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-calendar"></i> Fecha</label>
                  <input type="date" formControlName="fecha" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                </div>
              </div>
              <div class="form-group">
                <label><i class="fas fa-comment"></i> Motivo</label>
                <textarea formControlName="motivo" placeholder="Motivo del deceso..." rows="2" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-danger" (click)="saveDeadBirds()" [disabled]="savingDeadBirds()">
                @if (savingDeadBirds()) { <span class="spinner-sm"></span> } @else { <i class="fas fa-save"></i> }
                Registrar
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tabs-container { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
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
    .modal-wide { max-width: 860px; width: 95vw; }
    .details-card { background: var(--gray-light); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; }
    .details-card h4 { font-size: 1.6rem; font-weight: 700; color: var(--gray-dark); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem; }
    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .detail-label { font-size: 1.1rem; font-weight: 600; color: var(--gray-dark); text-transform: uppercase; opacity: 0.7; }
    .detail-value { font-size: 1.4rem; color: var(--gray-dark); word-break: break-all; }
    .history-section h4 { font-size: 1.6rem; font-weight: 700; color: var(--gray-dark); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem; }
    .capacity-indicator {
      margin-top: 0.6rem; padding: 0.7rem 1rem; border-radius: 6px; font-size: 1.3rem; font-weight: 600;
      display: flex; align-items: center; gap: 0.6rem;
      &.cap-ok  { background: rgba(57,169,0,0.1);  color: #2d7a00; border: 1px solid rgba(57,169,0,0.3); }
      &.cap-warn { background: rgba(255,152,0,0.12); color: #b36200; border: 1px solid rgba(255,152,0,0.4); }
      &.cap-full { background: rgba(244,67,54,0.1);  color: #b71c1c; border: 1px solid rgba(244,67,54,0.3); }
    }
  `],
})
export class FlocksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private flocksService = inject(FlocksService);
  private barnsService = inject(BarnsService);
  private breedsService = inject(BreedsService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);
  public permissions = inject(PermissionsService);
  private refreshService = inject(DashboardRefreshService);

  loading = signal(true);
  flocks = signal<Flock[]>([]);
  filteredFlocks = signal<Flock[]>([]);
  barns = signal<Barn[]>([]);
  breeds = signal<Breed[]>([]);
  activeTab = signal<'flocks' | 'barns' | 'history'>('flocks');
  searchQuery = '';
  searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 5;

  showFlockModal = signal(false);
  showBarnModal = signal(false);
  showDeadBirdsModal = signal(false);
  showEditFlockModal = signal(false);
  showDetailsModal = signal(false);
  savingFlock = signal(false);
  savingBarn = signal(false);
  savingDeadBirds = signal(false);
  savingEditFlock = signal(false);
  editingBarn = signal<Barn | null>(null);
  editingFlock = signal<Flock | null>(null);
  selectedFlock = signal<Flock | null>(null);
  detailsHistory = signal<any[]>([]);
  loadingHistory = signal(false);

  // Pagination for Barns and Detail history
  barnsPage = 1;
  barnsLimit = 5;
  detailsHistoryPage = 1;
  detailsHistoryLimit = 5;

  get pagedBarns(): Barn[] {
    const start = (this.barnsPage - 1) * this.barnsLimit;
    return this.filteredBarns().slice(start, start + this.barnsLimit);
  }

  get barnsTotalPages(): number {
    return Math.ceil(this.filteredBarns().length / this.barnsLimit);
  }

  onBarnsPageChange(page: number): void {
    this.barnsPage = page;
  }

  get pagedDetailsHistory(): any[] {
    const start = (this.detailsHistoryPage - 1) * this.detailsHistoryLimit;
    return this.detailsHistory().slice(start, start + this.detailsHistoryLimit);
  }

  get detailsHistoryTotalPages(): number {
    return Math.ceil(this.detailsHistory().length / this.detailsHistoryLimit);
  }

  onDetailsHistoryPageChange(page: number): void {
    this.detailsHistoryPage = page;
  }

  // History tab
  historyItems = signal<any[]>([]);
  historyPage = 1;
  historyTotalPages = 1;
  historyTotal = 0;
  historySearch = '';
  historySearchSubject = new Subject<string>();

  // Barn search
  barnSearchQuery = '';
  filteredBarns = signal<Barn[]>([]);

  totalGallinas = signal(0);
  activeFlocks = signal(0);

  // Form matching CreateFlockDto
  flockForm = this.fb.group({
    nombre: ['', Validators.required],
    total_aves: [null as number | null, [Validators.required, Validators.min(1)]],
    razaId: ['', Validators.required],
    galponId: ['', Validators.required],
    observacion: ['', Validators.required],
    racion_alimento: ['', Validators.required],
  });

  /**
   * Reactive bridge: converts flockForm.valueChanges (RxJS Observable) into
   * an Angular signal so that computed() can depend on it and update live.
   */
  private readonly flockFormValue = toSignal(this.flockForm.valueChanges, {
    initialValue: this.flockForm.value,
  });

  /** Live capacity info for the Registrar Lote form's selected barn. */
  barnCapacityInfo = computed(() => {
    const v = this.flockFormValue();
    const galponId = v?.galponId as string | null | undefined;
    const totalAves = Number(v?.total_aves) || 0;
    if (!galponId || !totalAves) return null;

    const barn = this.barns().find(b => b.id_galpon === galponId);
    if (!barn) return null;

    // Count birds in ACTIVE flocks already assigned to this barn
    const currentOccupancy = this.flocks()
      .filter(f =>
        (f.estado === 'ACTIVO' || f.estado === 'activo') &&
        f.ubicacion?.some((u: any) => u.galpon?.id_galpon === galponId)
      )
      .reduce((sum, f) => sum + (f.total_aves || 0), 0);

    const maxCapacity: number = barn.capacidad_max_aves;
    const available = maxCapacity - currentOccupancy;
    const projected = currentOccupancy + totalAves;
    const pct = Math.round((currentOccupancy / maxCapacity) * 100);

    if (projected > maxCapacity) {
      return {
        status: 'full' as const,
        message: `Capacidad insuficiente. Disponible: ${Math.max(0, available)} aves (ocupado: ${currentOccupancy}/${maxCapacity}).`,
      };
    } else if (projected > maxCapacity * 0.85) {
      return {
        status: 'warn' as const,
        message: `Cerca del límite. Disponible: ${available} aves (ocupado: ${currentOccupancy}/${maxCapacity}, ${pct}%).`,
      };
    } else {
      return {
        status: 'ok' as const,
        message: `Capacidad disponible: ${available} aves (ocupado: ${currentOccupancy}/${maxCapacity}).`,
      };
    }
  });

  // Form matching UpdateFlockDto (edit)
  editFlockForm = this.fb.group({
    nombre: ['', Validators.required],
    total_aves: [null as number | null, [Validators.required, Validators.min(1)]],
    razaId: [''],
    galponId: [''],
    observacion: [''],
    racion_alimento: [''],
    estado: [''],
  });

  // Form matching CreateBarnDto: { codigo, nombre, capacidad_max_aves, area }
  barnForm = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    capacidad_max_aves: [null as number | null, [Validators.required, Validators.min(1)]],
    area: [null as number | null, [Validators.required, Validators.min(0.1)]],
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
    this.historySearchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.historyPage = 1;
      this.loadHistory();
    });
  }

  private loadData(): void {
    this.loading.set(true);
    this.flocksService.getAllPaginated({ page: this.currentPage, limit: this.limit, search: this.searchQuery }).subscribe({
      next: (res: any) => {
        const data = res?.data || (Array.isArray(res) ? res : []);
        this.flocks.set(data);
        this.filteredFlocks.set(data);
        this.totalItems = res?.total ?? data.length;
        this.totalPages = res?.totalPages ?? 1;
        this.currentPage = res?.page ?? 1;
        const activos = data.filter((f: any) => f.estado === 'ACTIVO' || f.estado === 'activo');
        this.activeFlocks.set(activos.length);
        this.totalGallinas.set(activos.reduce((s: number, f: any) => s + (f.total_aves || 0), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.barnsService.getAll().subscribe((b) => {
      this.barns.set(b);
      this.applyBarnFilter();
    });
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
    const q = this.searchQuery.toLowerCase();
    this.filteredFlocks.set(this.flocks().filter((f) =>
      `${f.nombre} ${f.raza?.nombre} ${f.ubicacion?.[0]?.galpon?.nombre || ''} ${f.ubicacion?.[0]?.galpon?.codigo || ''}`.toLowerCase().includes(q)
    ));
  }

  openModal(type: 'flock' | 'barn'): void {
    if (type === 'flock') { this.flockForm.reset(); this.showFlockModal.set(true); }
    if (type === 'barn') { this.barnForm.reset(); this.editingBarn.set(null); this.showBarnModal.set(true); }
  }

  openEditFlockModal(flock: Flock): void {
    this.editingFlock.set(flock);
    this.editFlockForm.patchValue({
      nombre: flock.nombre,
      total_aves: flock.total_aves,
      observacion: flock.observacion,
      racion_alimento: flock.racion_alimento,
      estado: flock.estado,
      razaId: (flock.raza as any)?.id_raza || '',
      galponId: flock.ubicacion?.[0]?.galpon?.id_galpon || '',
    });
    // Disable fields based on permissions
    const canAdmin = this.permissions.hasPermission('LOTES_EDITAR');
    if (!canAdmin) {
      this.editFlockForm.get('nombre')?.disable();
      this.editFlockForm.get('estado')?.disable();
    } else {
      this.editFlockForm.get('nombre')?.enable();
      this.editFlockForm.get('estado')?.enable();
    }
    this.showEditFlockModal.set(true);
  }

  openDetailsModal(flock: Flock): void {
    this.selectedFlock.set(flock);
    this.showDetailsModal.set(true);
    this.loadingHistory.set(true);
    this.detailsHistoryPage = 1;
    this.flocksService.getHistory({ loteId: flock.id_lote, page: 1, limit: 50 }).subscribe({
      next: (res: any) => {
        const data = res?.data || (Array.isArray(res) ? res : []);
        this.detailsHistory.set(data);
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  loadHistory(): void {
    this.loadingHistory.set(true);
    this.flocksService.getHistory({ page: this.historyPage, limit: 5, search: this.historySearch }).subscribe({
      next: (res: any) => {
        const data = res?.data || (Array.isArray(res) ? res : []);
        this.historyItems.set(data);
        this.historyTotal = res?.total ?? data.length;
        this.historyTotalPages = res?.totalPages ?? 1;
        this.loadingHistory.set(false);
      },
      error: () => this.loadingHistory.set(false),
    });
  }

  onHistorySearchInput(): void { this.historySearchSubject.next(this.historySearch); }
  onHistoryPageChange(page: number): void { this.historyPage = page; this.loadHistory(); }

  applyBarnFilter(): void {
    const q = this.barnSearchQuery.toLowerCase();
    this.filteredBarns.set(
      this.barns().filter(b =>
        b.nombre.toLowerCase().includes(q) || b.codigo.toLowerCase().includes(q)
      )
    );
    this.barnsPage = 1;
  }

  onBarnSearchInput(): void { this.applyBarnFilter(); }

  closeModals(): void {
    this.showFlockModal.set(false);
    this.showBarnModal.set(false);
    this.showDeadBirdsModal.set(false);
    this.showEditFlockModal.set(false);
    this.showDetailsModal.set(false);
  }

  saveFlock(): void {
    if (this.flockForm.invalid) { this.flockForm.markAllAsTouched(); return; }
    this.savingFlock.set(true);
    const data = this.flockForm.value;
    this.flocksService.create(data as Partial<Flock>).subscribe({
      next: () => {
        this.toast.success('Lote registrado exitosamente');
        this.closeModals();
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
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
      next: () => {
        this.toast.success(editing ? 'Galpón actualizado' : 'Galpón registrado');
        this.closeModals();
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar el galpón');
      },
    });
  }

  saveEditFlock(): void {
    if (this.editFlockForm.invalid) { this.editFlockForm.markAllAsTouched(); return; }
    const flock = this.editingFlock();
    if (!flock) return;
    this.savingEditFlock.set(true);
    const raw = this.editFlockForm.getRawValue();
    const payload: any = {};
    if (raw.nombre) payload.nombre = raw.nombre;
    if (raw.total_aves) payload.total_aves = raw.total_aves;
    if (raw.observacion !== undefined) payload.observacion = raw.observacion;
    if (raw.racion_alimento !== undefined) payload.racion_alimento = raw.racion_alimento;
    if (raw.estado) payload.estado = raw.estado;
    this.flocksService.update(flock.id_lote, payload).subscribe({
      next: () => {
        this.toast.success('Lote actualizado exitosamente');
        this.closeModals();
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err: any) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al actualizar el lote');
        this.savingEditFlock.set(false);
      },
      complete: () => this.savingEditFlock.set(false),
    });
  }

  editBarn(barn: Barn): void {
    this.editingBarn.set(barn);
    this.barnForm.patchValue({
      codigo: barn.codigo,
      nombre: barn.nombre,
      capacidad_max_aves: barn.capacidad_max_aves ?? null,
      area: barn.area ?? null,
    });
    this.showBarnModal.set(true);
  }

  async deleteBarn(id: string) {
    const barn = this.barns().find(b => b.id_galpon === id);
    const barnName = barn ? barn.nombre : '';

    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el galpón '${barnName}'? Esta acción no se puede deshacer.`
    });

    if (!confirmed) return;

    this.barnsService.delete(id).subscribe({
      next: () => {
        this.toast.success('Galpón eliminado');
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: (err) =>{
        const msg = err?.error?.message;
        this.toast.error(msg ? `${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al eliminar el galpón');
      },
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
      next: () => {
        this.toast.success('Registro de aves muertas guardado');
        this.closeModals();
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: () => { this.toast.error('Error al registrar aves muertas'); this.savingDeadBirds.set(false); },
      complete: () => this.savingDeadBirds.set(false),
    });
  }

  async finalizeFlock(flock: Flock) {
    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar finalización',
      message: `¿Estás seguro de que deseas finalizar el Lote '${flock.nombre}'? Esta acción no se puede deshacer.`,
      btnConfirmText: 'Finalizar'
    });

    if (!confirmed) return;

    this.flocksService.finalizeFlock({ id_lote: flock.id_lote }).subscribe({
      next: () => {
        this.toast.success('Lote finalizado exitosamente');
        this.loadData();
        this.refreshService.notifyDataChanged();
      },
      error: () => this.toast.error('Error al finalizar el lote'),
    });
  }
}
