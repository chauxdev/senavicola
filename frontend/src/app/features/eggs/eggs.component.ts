import { Component, inject, OnInit, signal, computed, ViewChild, ElementRef, HostListener } from '@angular/core';
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
import { CameraService, CameraStatus } from '../../core/services/camera.service';
import { VisionApiService, VisionModelInfo } from '../../core/services/vision.service';

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
            <!-- Panel Izquierdo: Simulación de Cámara -> Cámara Real -->
            <div class="camera-simulation-panel" style="background: #f8f9fa; border-radius: 12px; padding: 2rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 2rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <h4 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #333;">Vista de Cámara</h4>
                  <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; font-weight: 600;">
                    <span [style.background]="cameraStatus() === 'conectado' ? '#4caf50' : (cameraStatus() === 'error' ? '#f44336' : '#94a3b8')" style="width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                    <span [style.color]="cameraStatus() === 'conectado' ? '#4caf50' : (cameraStatus() === 'error' ? '#f44336' : '#94a3b8')">{{ cameraStatus() | uppercase }}</span>
                  </div>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center;">
                  <select [value]="selectedModelId()" (change)="selectedModelId.set($any($event.target).value)" style="padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 1.3rem;">
                    @if (availableModels().length === 0) {
                      <option value="">Cargando IA...</option>
                    }
                    @for (model of availableModels(); track model.id) {
                      <option [value]="model.id">{{ model.name }} {{ model.isAvailable ? '✓' : '⚠ No config' }}</option>
                    }
                  </select>
                  <select [value]="selectedCamera()" (change)="selectedCamera.set($any($event.target).value); toggleCamera(true)" style="padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 1.3rem;">
                    @if (availableCameras().length === 0) {
                      <option value="camara_1">Cámara Principal</option>
                    }
                    @for (cam of availableCameras(); track cam.deviceId) {
                      <option [value]="cam.deviceId">{{ cam.label || 'Cámara ' + ($index + 1) }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Camera Screen -->
              <div class="camera-screen" style="position: relative; aspect-ratio: 16/9; background: #0f172a; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; color: white;">
                <video #cameraVideo (click)="onVideoClick($event)" playsinline style="width: 100%; height: 100%; object-fit: contain; cursor: crosshair;" [style.display]="cameraStatus() === 'conectado' ? 'block' : 'none'" [style.transform]="(cameraService.currentCalibration.rotation === 180 ? 'rotate(180deg) ' : '') + (cameraService.currentCalibration.flip ? 'scaleX(-1)' : '')"></video>
                
                @if (cameraStatus() === 'conectado' && realtimeData()?.contorno) {
                  <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;" [attr.viewBox]="getViewBox()" preserveAspectRatio="xMidYMid meet">
                    <polygon [attr.points]="getContourPoints()" fill="rgba(76, 175, 80, 0.3)" stroke="#4caf50" stroke-width="3"/>
                  </svg>
                }
                
                @if (isCalibratingVolume()) {
                  <div style="position: absolute; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; padding: 1rem; z-index: 60; text-align: center;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #ffeb3b;">Modo Calibración de Volumen</h3>
                    <p style="margin: 0; font-size: 1.1rem;">Haz clic en 2 puntos separados por exactamente <strong>{{ volumeCalibDist() }} cm</strong> en el video.</p>
                    <p style="margin: 0.5rem 0 0 0; color: #4caf50;">Puntos marcados: {{ volumeCalibPoints().length }} / 2</p>
                    <div style="margin-top: 1rem; display: flex; gap: 1rem; justify-content: center; align-items: center;">
                      <label>Distancia real (cm):</label>
                      <input type="number" step="0.5" min="1" [(ngModel)]="volumeCalibDist" style="width: 80px; padding: 0.5rem; color: black; border-radius: 4px;" />
                      <button class="btn-secondary" (click)="isCalibratingVolume.set(false); volumeCalibPoints.set([])" style="padding: 0.5rem 1rem;">Cancelar</button>
                    </div>
                  </div>
                }
                
                @if (cameraStatus() !== 'conectado') {
                  <div style="text-align: center;">
                    <i class="fas fa-video-slash" style="font-size: 4rem; color: #f44336; margin-bottom: 1rem; display: block;"></i>
                    <p style="font-size: 1.4rem; color: #94a3b8;">{{ cameraStatus() === 'error' ? 'ERROR EN CÁMARA' : 'CÁMARA APAGADA' }}</p>
                  </div>
                }

                @if (cameraStatus() === 'conectado' && cameraService.currentCalibration.roi) {
                  <div style="position: absolute; z-index: 50; border: 2px dashed #ffeb3b; display: flex; align-items: center; justify-content: center; color: #ffeb3b; font-weight: bold; text-shadow: 1px 1px 2px black; pointer-events: none;" 
                    [style.background]="isCalibrating() ? 'rgba(255, 235, 59, 0.2)' : 'transparent'"
                    [style.left.px]="cameraService.currentCalibration.roi.x"
                    [style.top.px]="cameraService.currentCalibration.roi.y"
                    [style.width.px]="cameraService.currentCalibration.roi.width"
                    [style.height.px]="cameraService.currentCalibration.roi.height">
                    ROI DISPLAY
                  </div>
                }

                @if (cameraStatus() === 'conectado' && realtimeData()) {
                  <div style="position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); padding: 1rem; border-radius: 8px; color: #fff; font-family: monospace; font-size: 1.2rem; z-index: 10;">
                    <div style="font-size: 1.6rem; font-weight: bold; color: #4caf50; margin-bottom: 0.5rem;">
                      <i class="fas fa-balance-scale"></i> Peso: {{ realtimeWeight() }}
                    </div>
                    <div style="color: #64b5f6;">
                      <i class="fas fa-cube"></i> Vol: {{ realtimeData()?.volumen_elipsoide_cm3 || 0 }} cm³
                    </div>
                    <div style="color: #ffb74d;">
                      <i class="fas fa-arrows-alt-h"></i> Ø: {{ realtimeData()?.diametro_cm || 0 }}cm | L: {{ realtimeData()?.largo_cm || 0 }}cm
                    </div>
                  </div>
                }

                @if (isPredicting() && !realtimeInterval) {
                  <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 20;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #4caf50; margin-bottom: 1rem;"></i>
                    <span style="font-weight: 600;">Analizando imagen...</span>
                  </div>
                }
              </div>

              @if (isCalibrating()) {
                <div style="background: #fff; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 1rem;">
                  <h5 style="margin: 0; font-size: 1.4rem;"><i class="fas fa-crosshairs"></i> Calibración de visión artificial</h5>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Posición X (px)</label>
                      <input type="number" [(ngModel)]="cameraService.currentCalibration.roi.x" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                    </div>
                    <div>
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Posición Y (px)</label>
                      <input type="number" [(ngModel)]="cameraService.currentCalibration.roi.y" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                    </div>
                    <div>
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Ancho (px)</label>
                      <input type="number" [(ngModel)]="cameraService.currentCalibration.roi.width" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                    </div>
                    <div>
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Alto (px)</label>
                      <input type="number" [(ngModel)]="cameraService.currentCalibration.roi.height" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Altura de la cámara (cm)</label>
                      <div style="display: flex; gap: 1rem; align-items: center;">
                        <input type="range" [(ngModel)]="cameraService.currentCalibration.cameraHeight" min="10" max="100" style="flex: 1;" />
                        <span style="font-weight: bold; font-size: 1.3rem;">{{ cameraService.currentCalibration.cameraHeight }} cm</span>
                      </div>
                    </div>
                    <div style="grid-column: span 2;">
                      <label style="font-size: 1.2rem; display: block; margin-bottom: 0.5rem;">Orientación de cámara</label>
                      <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" (click)="cameraService.currentCalibration.rotation = cameraService.currentCalibration.rotation === 180 ? 0 : 180" style="flex: 1; padding: 0.8rem; border-radius: 6px; font-weight: 600;">
                          <i class="fas fa-sync-alt"></i> {{ cameraService.currentCalibration.rotation === 180 ? 'Volver a Normal' : 'Rotar 180° (Boca abajo)' }}
                        </button>
                        <button class="btn-secondary" (click)="cameraService.currentCalibration.flip = !cameraService.currentCalibration.flip" style="flex: 1; padding: 0.8rem; border-radius: 6px; font-weight: 600;">
                          <i class="fas fa-arrows-alt-h"></i> {{ cameraService.currentCalibration.flip ? 'Quitar Espejo' : 'Modo Espejo' }}
                        </button>
                      </div>
                    </div>
                    <div style="grid-column: span 2; border-top: 1px solid #ccc; padding-top: 1rem; margin-top: 0.5rem;">
                      <h6 style="margin: 0 0 1rem 0; font-size: 1.2rem; color: #555;"><i class="fas fa-sliders-h"></i> Ajustes Finos de Lectura</h6>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div>
                          <label style="font-size: 1.1rem; display: block; margin-bottom: 0.2rem; font-weight: 600;">Sensibilidad a Reflejos</label>
                          <small style="display: block; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Súbelo (ej. 45, 55) si hay mucho brillo en la pantalla. (Debe ser impar)</small>
                          <input type="number" step="2" min="3" [(ngModel)]="cameraService.currentCalibration.block_size" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                        </div>
                        <div>
                          <label style="font-size: 1.1rem; display: block; margin-bottom: 0.2rem; font-weight: 600;">Grosor de los Números</label>
                          <small style="display: block; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Bájalo (ej. 10, 5) si los números se ven rotos o entrecortados.</small>
                          <input type="number" [(ngModel)]="cameraService.currentCalibration.c_value" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                        </div>
                        <div>
                          <label style="font-size: 1.1rem; display: block; margin-bottom: 0.2rem; font-weight: 600;">Claridad de Pantalla</label>
                          <small style="display: block; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Súbelo si la pantalla se ve muy oscura y no resalta el número.</small>
                          <input type="number" step="0.5" [(ngModel)]="cameraService.currentCalibration.clahe_clip" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                        </div>
                        <div>
                          <label style="font-size: 1.1rem; display: block; margin-bottom: 0.2rem; font-weight: 600;">Inclinación (Cursiva)</label>
                          <small style="display: block; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Normalmente 0. Úsalo si los números de la báscula están ladeados.</small>
                          <input type="number" [(ngModel)]="cameraService.currentCalibration.shear_angle" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                    <button class="btn-green" (click)="saveCalibration()" style="flex: 1; padding: 0.8rem; border-radius: 6px;"><i class="fas fa-save"></i> Guardar</button>
                    <button class="btn-secondary" (click)="isCalibrating.set(false)" style="flex: 1; padding: 0.8rem; border-radius: 6px;">Cerrar</button>
                  </div>
                </div>
              }

              <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                <button type="button" class="btn-green" [disabled]="permissions.isVisitor()" (click)="toggleCamera()" style="flex: 1; padding: 1rem; font-size: 1.3rem; font-weight: 600; border-radius: 6px; cursor: pointer; justify-content: center; display: flex; align-items: center; gap: 0.5rem;">
                  @if (cameraStatus() === 'conectado') {
                    <i class="fas fa-power-off"></i> Detener cámara
                  } @else {
                    <i class="fas fa-plug"></i> Iniciar cámara
                  }
                </button>
                <button type="button" class="btn-secondary" [disabled]="permissions.isVisitor() || cameraStatus() !== 'conectado'" (click)="isCalibrating.set(!isCalibrating())" style="padding: 1rem; font-size: 1.3rem; font-weight: 600; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: #e2e8f0; border: none;">
                  <i class="fas fa-tools"></i> Calibrar visión
                </button>
                <button type="button" class="btn-secondary" [disabled]="permissions.isVisitor() || cameraStatus() !== 'conectado'" (click)="isCalibratingVolume.set(true)" style="padding: 1rem; font-size: 1.3rem; font-weight: 600; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: #fff9c4; border: 1px solid #fbc02d; color: #f57f17;">
                  <i class="fas fa-ruler-combined"></i> Calibrar Volumen
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

                <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem;">
                  <button type="button" class="btn-green" [disabled]="saving() || !selectedAutoLoteId() || cameraStatus() !== 'conectado' || permissions.isVisitor()" (click)="handleCaptureClick()" style="flex: 1; padding: 1.5rem; font-size: 1.5rem; font-weight: 700; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 1rem; box-shadow: 0 4px 6px rgba(57,169,0,0.2);">
                    <i class="fas fa-camera"></i> {{ timerActive() ? 'Capturando en ' + timerCount() + '...' : 'Capturar Peso / Clasificar' }}
                  </button>
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; color: #4b5563; cursor: pointer; background: #f1f5f9; padding: 1.5rem; border-radius: 8px; font-weight: 600;">
                    <input type="checkbox" [checked]="useTimer()" (change)="toggleTimer()" style="width: 1.4rem; height: 1.4rem; cursor: pointer;" />
                    <i class="fas fa-clock"></i> 3s Retardo
                  </label>
                </div>
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
                    @for (item of historyItems().slice(0, 5); track item.id_historial_huevo; let idx = $index) {
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
  permissions = inject(PermissionsService);
  refreshService = inject(DashboardRefreshService);
  confirmService = inject(ConfirmService);
  cameraService = inject(CameraService);
  visionService = inject(VisionApiService);

  @ViewChild('cameraVideo') cameraVideo!: ElementRef<HTMLVideoElement>;

  availableCameras = signal<MediaDeviceInfo[]>([]);
  availableModels = signal<VisionModelInfo[]>([]);
  selectedModelId = signal<string>('');
  isCalibrating = signal(false);
  isPredicting = signal(false);
  loading = signal<boolean>(false);

  // State
  eggTypes = signal<EggType[]>([]);
  inventory = signal<EggInventory[]>([]);
  statsInventory = signal<EggInventory[]>([]);
  filtered = signal<EggInventory[]>([]);
  flocks = signal<Flock[]>([]);
  barns = signal<Barn[]>([]);
  selectedManualBarnId = signal<string>('');
  selectedAutoBarnId = signal<string>('');
  selectedCamera = signal<string>('camara_1');
  cameraStatus = signal<'conectado' | 'desconectado' | 'error'>('desconectado');
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
  
  getContourPoints(): string {
    const pts = this.realtimeData()?.contorno;
    if (!pts || !Array.isArray(pts)) return '';
    return pts.map((p: any) => `${p[0]},${p[1]}`).join(' ');
  }

  getViewBox(): string {
    const video = this.cameraVideo?.nativeElement;
    if (video && video.videoWidth) {
      let width = video.videoWidth;
      let height = video.videoHeight;
      const MAX_DIM = 640;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      return `0 0 ${width} ${height}`;
    }
    return '0 0 640 480';
  }

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

  async ngOnInit() {
    this.loadData();
    this.loadHistory();
    this.loadDamagedData();

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => { this.currentPage = 1; this.loadData(); });
    this.historySearchSubject.pipe(debounceTime(300)).subscribe(() => { this.hCurrentPage = 1; this.loadHistory(); });
    this.damagedSearchSubject.pipe(debounceTime(300)).subscribe(() => { this.dCurrentPage = 1; this.loadDamagedData(); });

    // Load available cameras
    this.availableCameras.set(await this.cameraService.getAvailableCameras());
    if (this.availableCameras().length > 0) {
      this.selectedCamera.set(this.availableCameras()[0].deviceId);
    }
    
    // Load available models
    this.visionService.getModels().subscribe({
      next: (response: any) => {
        const models = response.data ?? response;
        this.availableModels.set(Array.isArray(models) ? models : []);
        if (models && models.length > 0) {
          this.selectedModelId.set(models[0].id);
        }
      },
      error: (e) => console.error('Error loading vision models', e)
    });

    this.cameraService.cameraStatus.subscribe(status => this.cameraStatus.set(status));
    
    this.eggTypesService.getAll().subscribe((t) => this.eggTypes.set(t));
    this.flocksService.getAll().subscribe((f) => this.flocks.set(Array.isArray(f) ? f.filter((fl) => fl.estado === 'ACTIVO') : []));
    this.barnsService.getAll().subscribe((b) => this.barns.set(Array.isArray(b) ? b : []));
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

  realtimeData = signal<any>(null);
  realtimeWeight = signal<string | number>('-');
  realtimeInterval: any;
  
  useTimer = signal<boolean>(false);
  timerActive = signal<boolean>(false);
  timerCount = signal<number>(3);
  
  toggleTimer() {
    this.useTimer.set(!this.useTimer());
  }

  @HostListener('window:keydown.space', ['$event'])
  handleSpacebar(event: Event) {
    // Only trigger if we are in automatic classification mode and camera is connected
    if (this.classifTab() === 'automatica' && this.cameraStatus() === 'conectado') {
      // Prevent scrolling down when pressing spacebar
      const target = event.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        event.preventDefault();
        this.handleCaptureClick();
      }
    }
  }

  handleCaptureClick() {
    if (this.useTimer()) {
      this.timerActive.set(true);
      this.timerCount.set(3);
      const interval = setInterval(() => {
        const count = this.timerCount() - 1;
        this.timerCount.set(count);
        if (count <= 0) {
          clearInterval(interval);
          this.timerActive.set(false);
          this.simulateAutoClassification();
        }
      }, 1000);
    } else {
      this.simulateAutoClassification();
    }
  }

  async toggleCamera(forceRestart = false) {
    if (this.cameraStatus() === 'conectado' && !forceRestart) {
      this.cameraService.stopCamera();
      this.stopRealtime();
    } else {
      try {
        await this.cameraService.initializeCamera(this.selectedCamera(), this.cameraVideo.nativeElement);
        this.startRealtime();
      } catch (err: any) {
        this.toast.error(err.message);
      }
    }
  }

  private getScaledCalibration(frameWidth: number, frameHeight: number) {
    const videoElement = this.cameraVideo.nativeElement;
    const baseCalibration = this.cameraService.currentCalibration;

    if (!videoElement.videoWidth) return baseCalibration;

    const videoRatio = videoElement.videoWidth / videoElement.videoHeight;
    const elementRatio = videoElement.clientWidth / videoElement.clientHeight;
    
    let renderedWidth, renderedHeight, offsetX = 0, offsetY = 0;
    if (videoRatio > elementRatio) {
      renderedWidth = videoElement.clientWidth;
      renderedHeight = renderedWidth / videoRatio;
      offsetY = (videoElement.clientHeight - renderedHeight) / 2;
    } else {
      renderedHeight = videoElement.clientHeight;
      renderedWidth = renderedHeight * videoRatio;
      offsetX = (videoElement.clientWidth - renderedWidth) / 2;
    }

    const realRoiX = baseCalibration.roi.x - offsetX;
    const realRoiY = baseCalibration.roi.y - offsetY;

    const scaleX = frameWidth / renderedWidth;
    const scaleY = frameHeight / renderedHeight;
    
    return {
      cameraHeight: baseCalibration.cameraHeight,
      block_size: baseCalibration.block_size,
      c_value: baseCalibration.c_value,
      clahe_clip: baseCalibration.clahe_clip,
      shear_angle: baseCalibration.shear_angle,
      roi: {
        x: Math.max(0, realRoiX * scaleX),
        y: Math.max(0, realRoiY * scaleY),
        width: baseCalibration.roi.width * scaleX,
        height: baseCalibration.roi.height * scaleY
      }
    };
  }

  private startRealtime() {
    this.stopRealtime();
    this.realtimeInterval = setInterval(() => {
      // Si la cámara no está conectada o estamos guardando un registro, no consultar
      if (this.cameraStatus() !== 'conectado' || this.isPredicting()) return;
      if (this.classifTab() !== 'automatica') return;

      try {
        const frameInfo = this.cameraService.getFrameInfo();
        const scaledCalib = this.getScaledCalibration(frameInfo.width, frameInfo.height);
        
        this.visionService.predict(this.selectedModelId(), frameInfo.base64, scaledCalib).subscribe({
          next: (res) => {
            if (res.success) {
              // SOLO actualizamos la interfaz para que el usuario vea los datos en tiempo real
              this.realtimeWeight.set(res.detected);
              if (res.metadata) {
                this.realtimeData.set(res.metadata);
              }
            }
          },
          error: () => {
            // Ignoramos errores para no saturar de notificaciones en tiempo real
          }
        });
      } catch (e) {
        // Ignorar errores de captura
      }
    }, 800); // 800ms para que sea rápido pero no sature tanto
  }

  private stopRealtime() {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
    }
    // No borramos la data al detener la cámara para que el último peso capturado quede visible
  }

  saveCalibration() {
    this.cameraService.saveCalibration(this.cameraService.currentCalibration);
    this.toast.success('Calibración guardada correctamente');
    this.isCalibrating.set(false);
  }

  simulateAutoClassification(): void {
    if (!this.selectedAutoLoteId()) {
      this.toast.error('Debe seleccionar un lote para clasificar');
      return;
    }
    if (this.cameraStatus() !== 'conectado') {
      this.toast.error('La cámara está desconectada');
      return;
    }

    const model = this.availableModels().find(m => m.id === this.selectedModelId());
    if (model && !model.isAvailable) {
      this.toast.error(`No se puede iniciar el modelo ${model.name}. El modelo todavía no está configurado.`);
      return;
    }

    try {
      this.isPredicting.set(true);
      const frameInfo = this.cameraService.getFrameInfo();
      const scaledCalib = this.getScaledCalibration(frameInfo.width, frameInfo.height);
      
      this.visionService.predict(this.selectedModelId(), frameInfo.base64, scaledCalib).subscribe({
        next: (res) => {
          this.isPredicting.set(false);
          if (!res.success) {
            this.toast.error(res.message || 'Error en la predicción');
            return;
          }

          // Actualizar el panel en vivo
          this.realtimeWeight.set(res.detected);
          if (res.metadata) {
            this.realtimeData.set(res.metadata);
          }
          
          if (res.weight) {
            this.lastDetectedWeight.set(res.weight);
            this.saveAutoProduction(res.weight);
          } else {
            this.toast.error(`Modelo detectó: "${res.detected}", pero no pudo extraer un peso válido.`);
          }
        },
        error: (err) => {
          this.isPredicting.set(false);
          this.toast.error('Error al comunicarse con el servicio de visión');
        }
      });
    } catch (err: any) {
      this.isPredicting.set(false);
      this.toast.error(err.message);
    }
  }

  private saveAutoProduction(weight: number) {
    let detectedTypeId = '';
    let detectedTypeName = '';
    const types = this.eggTypes();
    for (const type of types) {
      if (weight >= type.peso_min && weight <= type.peso_max) {
        detectedTypeId = type.id_tipo;
        detectedTypeName = type.tipo;
        break;
      }
    }
    if (!detectedTypeId && types.length > 0) {
      const type = types[types.length - 1];
      detectedTypeId = type.id_tipo;
      detectedTypeName = type.tipo;
    }
    this.lastDetectedType.set(detectedTypeName);

    const data = {
      loteId: this.selectedAutoLoteId(),
      tipoHuevoId: detectedTypeId,
      cantidad: Number(this.autoQuantity()),
    };

    this.saving.set(true);
    this.eggService.registerProduction(data).subscribe({
      next: () => {
        this.toast.success(`Captura exitosa: ${weight}g (${detectedTypeName})`);
        this.loadData();
        this.loadHistory();
        this.refreshService.notifyDataChanged();
      },
      error: () => this.toast.error('Error al registrar la clasificación automática'),
      complete: () => this.saving.set(false),
    });
  }

  isCalibratingVolume = signal(false);
  volumeCalibPoints = signal<{x: number, y: number}[]>([]);
  volumeCalibDist = signal<number>(5.0);

  onVideoClick(event: MouseEvent) {
    if (!this.isCalibratingVolume()) return;

    const video = this.cameraVideo?.nativeElement;
    if (!video) return;

    const rect = video.getBoundingClientRect();
    
    // Calculate actual displayed video dimensions (handling object-fit: contain)
    const videoRatio = video.videoWidth / video.videoHeight;
    const elementRatio = rect.width / rect.height;
    
    let displayWidth, displayHeight, offsetX = 0, offsetY = 0;
    if (elementRatio > videoRatio) {
      displayHeight = rect.height;
      displayWidth = rect.height * videoRatio;
      offsetX = (rect.width - displayWidth) / 2;
    } else {
      displayWidth = rect.width;
      displayHeight = rect.width / videoRatio;
      offsetY = (rect.height - displayHeight) / 2;
    }

    // Click relative to the displayed video
    let clickX = event.clientX - rect.left - offsetX;
    let clickY = event.clientY - rect.top - offsetY;

    // Backend scaling logic (matches camera.service.ts)
    let scaledWidth = video.videoWidth;
    let scaledHeight = video.videoHeight;
    const MAX_DIM = 640;
    if (scaledWidth > MAX_DIM || scaledHeight > MAX_DIM) {
      if (scaledWidth > scaledHeight) {
        scaledHeight = Math.round((scaledHeight * MAX_DIM) / scaledWidth);
        scaledWidth = MAX_DIM;
      } else {
        scaledWidth = Math.round((scaledWidth * MAX_DIM) / scaledHeight);
        scaledHeight = MAX_DIM;
      }
    }

    // Map click from display size to backend scaled size
    const pointX = (clickX / displayWidth) * scaledWidth;
    const pointY = (clickY / displayHeight) * scaledHeight;

    this.volumeCalibPoints.update(pts => {
      const newPts = [...pts, {x: pointX, y: pointY}];
      if (newPts.length === 2) {
        this.submitVolumeCalibration(newPts);
      }
      return newPts;
    });
  }

  async submitVolumeCalibration(pts: {x: number, y: number}[]) {
    try {
      const hostname = window.location.hostname;
      const res = await fetch(`http://${hostname}:8020/calibrar-escala`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          punto1: [pts[0].x, pts[0].y],
          punto2: [pts[1].x, pts[1].y],
          distancia_cm: this.volumeCalibDist()
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        this.toast.success(`Escala calibrada: ${data.px_por_cm} px/cm`);
        this.isCalibratingVolume.set(false);
      } else {
        this.toast.error(data.error || 'Error al calibrar');
      }
    } catch (e) {
      this.toast.error('Error al conectar con visión-volumen');
    }
    this.volumeCalibPoints.set([]);
  }

}
