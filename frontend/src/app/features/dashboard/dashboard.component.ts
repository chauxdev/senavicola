import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardApiService } from '../../core/services/api.services';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { DashboardRefreshService } from '../../core/services/dashboard-refresh.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-wrapper">
      <!-- Fondo decorativo -->
      <div class="bg-mesh"></div>

      <div class="dashboard-page">
        <!-- Título del Dashboard -->
        <div class="dashboard_titulo">
          <div class="title-content">
            <h2>Panel de Producción</h2>
            <p class="subtitle">Métricas en tiempo real de SenaVícola</p>
          </div>
          <div class="period-filter">
            <div class="filter-label">Periodo:</div>
            <select (change)="onPeriodChange($event)" [value]="selectedPeriod()">
              <option value="day">Hoy</option>
              <option value="week">Últimos 7 Días</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
              <option value="all">Todo el Histórico</option>
            </select>
          </div>
        </div>

        <!-- Cards de Estadísticas -->
        <div class="stats-grid">
          <div class="premium-stat-card">
            <div class="stat-glow orange-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper orange">
                <i class="fas fa-egg"></i>
              </div>
              <span class="stat-badge orange">Producción</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalHuevos() | number }}</div>
              <div class="stat-label">Huevos Recolectados</div>
            </div>
          </div>

          <div class="premium-stat-card">
            <div class="stat-glow green-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper green">
                <i class="fas fa-dove"></i>
              </div>
              <span class="stat-badge green">Inventario</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalGallinas() | number }}</div>
              <div class="stat-label">Aves Activas</div>
            </div>
          </div>

          <div class="premium-stat-card">
            <div class="stat-glow purple-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper purple">
                <i class="fas fa-layer-group"></i>
              </div>
              <span class="stat-badge purple">Operación</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalLotes() | number }}</div>
              <div class="stat-label">Lotes en Producción</div>
            </div>
          </div>

          <div class="premium-stat-card">
            <div class="stat-glow blue-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper blue">
                <i class="fas fa-chart-pie"></i>
              </div>
              <span class="stat-badge blue">Calidad</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalClasificados() | number }}</div>
              <div class="stat-label">Lotes Clasificados</div>
            </div>
          </div>

          <div class="premium-stat-card">
            <div class="stat-glow cyan-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper cyan">
                <i class="fas fa-warehouse"></i>
              </div>
              <span class="stat-badge cyan">Infraestructura</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalGalpones() | number }}</div>
              <div class="stat-label">Galpones Activos</div>
            </div>
          </div>

          <div class="premium-stat-card">
            <div class="stat-glow pink-glow"></div>
            <div class="stat-header">
              <div class="stat-icon-wrapper pink">
                <i class="fas fa-box-open"></i>
              </div>
              <span class="stat-badge pink">Logística</span>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ totalInsumos() | number }}</div>
              <div class="stat-label">Insumos Disponibles</div>
            </div>
          </div>
        </div>

        <!-- Gráficas -->
        <div class="charts-grid">
          <!-- Gráfica Principal -->
          <div class="chart-card premium-shadow col-span-2">
            <div class="chart-header">
              <div class="chart-title">
                <div class="chart-icon"><i class="fas fa-chart-area"></i></div>
                <div>
                  <h3>Flujo de Producción</h3>
                  <p>Tendencia de recolección de huevos</p>
                </div>
              </div>
            </div>
            <div class="chart-container large">
              <canvas id="chartLinea"></canvas>
            </div>
          </div>

          <!-- Gráficas Secundarias -->
          <div class="chart-card premium-shadow">
            <div class="chart-header">
              <div class="chart-title">
                <div class="chart-icon orange"><i class="fas fa-egg"></i></div>
                <div>
                  <h3>Clasificación por Calibre</h3>
                  <p>Distribución de calidad</p>
                </div>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="chartBarras"></canvas>
            </div>
          </div>

          <div class="chart-card premium-shadow">
            <div class="chart-header">
              <div class="chart-title">
                <div class="chart-icon pink"><i class="fas fa-shopping-basket"></i></div>
                <div>
                  <h3>Inventario de Insumos</h3>
                  <p>Categorías disponibles</p>
                </div>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="chartDona"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`


    .dashboard-wrapper {
      position: relative;
      min-height: 100%;
      background-color: #f8fafc;
      font-family: 'Work Sans', sans-serif;
      margin: -2.5rem;
      padding: 2.5rem;
      z-index: 1;
      overflow: hidden;
    }

    .bg-mesh {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 400px;
      background: radial-gradient(at 0% 0%, hsla(113,87%,58%,0.15) 0px, transparent 50%),
                  radial-gradient(at 100% 0%, hsla(199,87%,58%,0.15) 0px, transparent 50%);
      z-index: -1;
    }

    .dashboard-page {
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Título y Filtro */
    .dashboard_titulo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3rem;
      padding-top: 1rem;
    }
    
    .title-content h2 {
      font-size: 3.2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.2rem 0;
      letter-spacing: -1.5px;
    }

    .subtitle {
      color: #64748b;
      margin: 0;
      font-size: 1.2rem;
      font-weight: 500;
      letter-spacing: -0.2px;
    }

    .period-filter {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 0.6rem 0.6rem 0.6rem 1.2rem;
      border-radius: 100px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.03);
    }

    .filter-label {
      font-size: 1.1rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .period-filter select {
      padding: 0.6rem 1.5rem;
      border-radius: 100px;
      border: none;
      background: #f1f5f9;
      font-size: 1.1rem;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      font-family: 'Work Sans', sans-serif;
    }

    .period-filter select:hover {
      background: #e2e8f0;
    }

    /* Premium Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .premium-stat-card {
      background: white;
      border-radius: 24px;
      padding: 2.2rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 30px -10px rgba(0,0,0,0.04);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .premium-stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
      border-color: rgba(226, 232, 240, 1);
    }

    .stat-glow {
      position: absolute;
      top: 0; right: 0;
      width: 150px; height: 150px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.15;
      z-index: 0;
      pointer-events: none;
      transition: opacity 0.4s ease;
    }
    
    .premium-stat-card:hover .stat-glow { opacity: 0.3; }

    .orange-glow { background: #f97316; }
    .green-glow { background: #22c55e; }
    .purple-glow { background: #a855f7; }
    .blue-glow { background: #3b82f6; }
    .cyan-glow { background: #06b6d4; }
    .pink-glow { background: #ec4899; }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: relative;
      z-index: 1;
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: white;
    }

    .stat-icon-wrapper.orange { background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 8px 16px rgba(249,115,22,0.2); }
    .stat-icon-wrapper.green { background: linear-gradient(135deg, #22c55e, #16a34a); box-shadow: 0 8px 16px rgba(34,197,94,0.2); }
    .stat-icon-wrapper.purple { background: linear-gradient(135deg, #a855f7, #9333ea); box-shadow: 0 8px 16px rgba(168,85,247,0.2); }
    .stat-icon-wrapper.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 8px 16px rgba(59,130,246,0.2); }
    .stat-icon-wrapper.cyan { background: linear-gradient(135deg, #06b6d4, #0891b2); box-shadow: 0 8px 16px rgba(6,182,212,0.2); }
    .stat-icon-wrapper.pink { background: linear-gradient(135deg, #ec4899, #db2777); box-shadow: 0 8px 16px rgba(236,72,153,0.2); }

    .stat-badge {
      padding: 0.4rem 1rem;
      border-radius: 100px;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    .stat-badge.orange { background: #fff7ed; color: #ea580c; }
    .stat-badge.green { background: #f0fdf4; color: #16a34a; }
    .stat-badge.purple { background: #faf5ff; color: #9333ea; }
    .stat-badge.blue { background: #eff6ff; color: #2563eb; }
    .stat-badge.cyan { background: #ecfeff; color: #0891b2; }
    .stat-badge.pink { background: #fdf2f8; color: #db2777; }

    .stat-body {
      position: relative;
      z-index: 1;
    }

    .stat-value {
      font-size: 3.6rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 0.5rem;
      letter-spacing: -1px;
    }

    .stat-label {
      font-size: 1.1rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    @media (max-width: 1200px) {
      .charts-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
    }

    .chart-card {
      background: white;
      padding: 2.5rem;
      border-radius: 24px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 30px -10px rgba(0,0,0,0.04);
      transition: all 0.3s ease;
    }

    .chart-header {
      margin-bottom: 2rem;
    }

    .chart-title {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }

    .chart-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .chart-icon.orange { color: #f97316; background: #fff7ed; }
    .chart-icon.pink { color: #ec4899; background: #fdf2f8; }

    .chart-title h3 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .chart-title p {
      margin: 0;
      color: #64748b;
      font-size: 1rem;
      font-weight: 500;
    }

    .chart-container {
      position: relative;
      height: 350px;
      width: 100%;
    }
    
    .chart-container.large {
      height: 450px;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardApiService = inject(DashboardApiService);
  private refreshService = inject(DashboardRefreshService);
  private refreshSub?: Subscription;

  totalHuevos = signal(0);
  totalGallinas = signal(0);
  totalLotes = signal(0);
  totalClasificados = signal(0);
  totalGalpones = signal(0);
  totalInsumos = signal(0);

  selectedPeriod = signal('week');

  chartsInstantiated: any[] = [];

  ngOnInit(): void {
    this.loadData();
    this.refreshSub = this.refreshService.refresh$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
    this.destroyCharts();
  }

  onPeriodChange(event: any): void {
    const value = event.target.value;
    this.selectedPeriod.set(value);
    this.loadData();
  }

  private loadData(): void {
    this.dashboardApiService.getStats(this.selectedPeriod()).subscribe({
      next: (stats) => {
        const totals = stats?.totals ?? {};
        const charts = stats?.charts ?? {};
        
        this.totalHuevos.set(totals.huevos ?? 0);
        this.totalGallinas.set(totals.gallinas ?? 0);
        this.totalLotes.set(totals.lotes ?? 0);
        this.totalClasificados.set(totals.clasificados ?? 0);
        this.totalGalpones.set(totals.galpones ?? 0);
        this.totalInsumos.set(totals.insumos ?? 0);

        this.destroyCharts();
        
        setTimeout(() => {
          this.renderProduccionChart(charts.produccionPorDia ?? {});
          this.renderHuevosChart(charts.huevosPorTipo ?? {});
          this.renderInsumosChart(charts.insumosPorCategoria ?? {});
        }, 50);
      },
      error: (err) => console.error('Error loading dashboard stats', err)
    });
  }

  private destroyCharts(): void {
    this.chartsInstantiated.forEach(c => c.destroy());
    this.chartsInstantiated = [];
  }

  private getChartOptions(override: any = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            font: { family: "'Work Sans', sans-serif", size: 13, weight: 500 },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: "'Work Sans', sans-serif", size: 15, weight: 700 },
          bodyFont: { family: "'Work Sans', sans-serif", size: 14, weight: 500 },
          padding: 16,
          cornerRadius: 12,
          boxPadding: 8,
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      ...override
    };
  }

  private renderProduccionChart(produccionPorDia: any): void {
    const labels = Object.keys(produccionPorDia);
    const data = Object.values(produccionPorDia);

    const ctx = document.getElementById('chartLinea') as HTMLCanvasElement;
    if (!ctx) return;
    
    const gradient = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 450);
    if (gradient) {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Sin datos'],
        datasets: [{
          label: 'Huevos Producidos',
          data: data.length ? data as number[] : [0],
          borderColor: '#3b82f6',
          borderWidth: 4,
          tension: 0.4,
          fill: true,
          backgroundColor: gradient || 'rgba(59, 130, 246, 0.1)',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#3b82f6',
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: this.getChartOptions({
        scales: {
          x: { 
            grid: { display: false },
            ticks: { font: { family: "'Work Sans', sans-serif", size: 13, weight: 500 }, color: '#64748b' }
          },
          y: { 
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)', drawBorderOnChartArea: false },
            ticks: { font: { family: "'Work Sans', sans-serif", size: 13, weight: 500 }, color: '#64748b', padding: 10 }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false,
        }
      })
    });
    this.chartsInstantiated.push(chart);
  }

  private renderHuevosChart(huevosPorTipo: any): void {
    const tipos = Object.keys(huevosPorTipo);
    const conteos = Object.values(huevosPorTipo);

    const chart = new Chart('chartBarras', {
      type: 'bar',
      data: {
        labels: tipos.length ? tipos : ['Sin datos'],
        datasets: [{
          label: 'Calibre',
          data: conteos.length ? conteos as number[] : [0],
          backgroundColor: [
            '#f97316',
            '#22c55e',
            '#3b82f6',
            '#a855f7',
            '#ec4899',
            '#06b6d4'
          ],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 40
        }]
      },
      options: this.getChartOptions({
        scales: {
          x: { 
            grid: { display: false },
            ticks: { font: { family: "'Work Sans', sans-serif", size: 13, weight: 500 }, color: '#64748b' }
          },
          y: { 
            beginAtZero: true, 
            grid: { color: 'rgba(0,0,0,0.04)', drawBorderOnChartArea: false },
            ticks: { font: { family: "'Work Sans', sans-serif", size: 13, weight: 500 }, color: '#64748b' }
          }
        },
        plugins: { legend: { display: false } }
      })
    });
    this.chartsInstantiated.push(chart);
  }

  private renderInsumosChart(insumosPorCategoria: any): void {
    const categories = Object.keys(insumosPorCategoria);
    const conteos = Object.values(insumosPorCategoria);

    const chart = new Chart('chartDona', {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['Sin datos'],
        datasets: [{
          data: conteos.length ? conteos as number[] : [1],
          backgroundColor: [
            '#ec4899', '#3b82f6', '#06b6d4', '#22c55e', '#eab308', '#f97316'
          ],
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: this.getChartOptions({ 
        cutout: '75%',
        layout: { padding: 20 } 
      })
    });
    this.chartsInstantiated.push(chart);
  }
}
