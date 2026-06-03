import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlocksService, BarnsService, EggInventoryService, SuppliesService, DashboardApiService } from '../../core/services/api.services';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Título del Dashboard -->
      <div class="dashboard_titulo">
        <h2>Inicio</h2>
      </div>

      <!-- Cards de Estadísticas -->
      <div class="dashboard_cards">
        <!-- Card: Huevos -->
        <div class="dashboard_card">
          <div class="card_icono naranja">
            <i class="fas fa-egg"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Huevos</p>
            <h3 class="card_valor">{{ totalHuevos() }}</h3>
            <span class="card_subtexto">Cantidad de huevos</span>
          </div>
        </div>

        <!-- Card: Gallinas -->
        <div class="dashboard_card">
          <div class="card_icono verde">
            <i class="fas fa-dove"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Gallinas</p>
            <h3 class="card_valor">{{ totalGallinas() }}</h3>
            <span class="card_subtexto">Total de gallinas</span>
          </div>
        </div>

        <!-- Card: Lotes -->
        <div class="dashboard_card">
          <div class="card_icono morado">
            <i class="fas fa-layer-group"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Lotes</p>
            <h3 class="card_valor">{{ totalLotes() }}</h3>
            <span class="card_subtexto">Lotes activos</span>
          </div>
        </div>

        <!-- Card: Clasificación -->
        <div class="dashboard_card">
          <div class="card_icono azul">
            <i class="fas fa-chart-bar"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Clasificación</p>
            <h3 class="card_valor">{{ totalClasificados() }}</h3>
            <span class="card_subtexto">Huevos clasificados</span>
          </div>
        </div>

        <!-- Card: Galpones -->
        <div class="dashboard_card">
          <div class="card_icono cyan">
            <i class="fas fa-warehouse"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Galpones</p>
            <h3 class="card_valor">{{ totalGalpones() }}</h3>
            <span class="card_subtexto">Total galpones</span>
          </div>
        </div>

        <!-- Card: Insumos -->
        <div class="dashboard_card">
          <div class="card_icono rosa">
            <i class="fas fa-box"></i>
          </div>
          <div class="card_info">
            <p class="card_label">Insumos</p>
            <h3 class="card_valor">{{ totalInsumos() }}</h3>
            <span class="card_subtexto">Insumos registrados</span>
          </div>
        </div>
      </div>

      <!-- Gráficas -->
      <div class="dashboard_graficas">
        <!-- Gráfica 1: Clasificación de Huevos (Barras) -->
        <div class="grafica_contenedor">
          <h3 class="grafica_titulo">Reporte de Clasificación de Huevos</h3>
          <canvas id="chartBarras"></canvas>
        </div>

        <!-- Gráfica 2: Clasificación de Huevos (Dona) -->
        <div class="grafica_contenedor">
          <h3 class="grafica_titulo">Tipos de Insumos</h3>
          <canvas id="chartDona"></canvas>
        </div>

        <!-- Gráfica 3: Producción de Huevos (Línea) -->
        <div class="grafica_contenedor">
          <h3 class="grafica_titulo">Producción de Huevos</h3>
          <canvas id="chartLinea"></canvas>
        </div>

        <!-- Gráfica 4: Estado de Gallinas (Torta) -->
        <div class="grafica_contenedor">
          <h3 class="grafica_titulo">Estado de Gallinas</h3>
          <canvas id="chartTorta"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard_titulo { margin-bottom: 2.5rem; }
    .dashboard_titulo h2 { font-size: 2.8rem; font-weight: 700; color: #333; }
    
    .dashboard_cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3.5rem; }
    .dashboard_card { background: white; border-radius: 15px; padding: 2.5rem 2rem; display: flex; align-items: center; gap: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: all 0.3s ease; border: 1px solid #f0f0f0; }
    .dashboard_card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
    
    .card_icono { width: 65px; height: 65px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2.8rem; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .card_icono.naranja { background: linear-gradient(135deg, #FF9800, #F57C00); }
    .card_icono.verde { background: linear-gradient(135deg, #4CAF50, #388E3C); }
    .card_icono.morado { background: linear-gradient(135deg, #9C27B0, #7B1FA2); }
    .card_icono.azul { background: linear-gradient(135deg, #2196F3, #1976D2); }
    .card_icono.cyan { background: linear-gradient(135deg, #00BCD4, #0097A7); }
    .card_icono.rosa { background: linear-gradient(135deg, #E91E63, #C2185B); }
    
    .card_info { flex: 1; }
    .card_label { font-size: 1.4rem; color: #666; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .card_valor { font-size: 3.2rem; font-weight: 700; color: #333; margin-bottom: 0.2rem; line-height: 1; }
    .card_subtexto { font-size: 1.2rem; color: #888; }
    
    .dashboard_graficas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5rem; margin-bottom: 3rem; }
    .grafica_contenedor { background: white; border-radius: 15px; padding: 2.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #f0f0f0; }
    .grafica_titulo { font-size: 1.6rem; font-weight: 600; color: #333; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
    canvas { width: 100% !important; height: 300px !important; }
    
    @media (max-width: 1200px) { .dashboard_cards { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) { .dashboard_graficas { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .dashboard_cards { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent implements OnInit {
  private dashboardApiService = inject(DashboardApiService);

  totalHuevos = signal(0);
  totalGallinas = signal(0);
  totalLotes = signal(0);
  totalClasificados = signal(0);
  totalGalpones = signal(0);
  totalInsumos = signal(0);

  chartsInstantiated: any[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dashboardApiService.getStats().subscribe({
      next: (stats) => {
        const { totals, charts } = stats;
        
        this.totalHuevos.set(totals.huevos);
        this.totalGallinas.set(totals.gallinas);
        this.totalLotes.set(totals.lotes);
        this.totalClasificados.set(totals.clasificados);
        this.totalGalpones.set(totals.galpones);
        this.totalInsumos.set(totals.insumos);

        this.destroyCharts();
        this.renderHuevosChart(charts.huevosPorTipo);
        this.renderInsumosChart(charts.insumosPorCategoria);
        this.renderProduccionChart(charts.produccionPorDia);
        this.renderGallinasChart(charts.estadoGallinas);
      },
      error: (err) => console.error('Error loading dashboard stats', err)
    });
  }

  private destroyCharts(): void {
    this.chartsInstantiated.forEach(c => c.destroy());
    this.chartsInstantiated = [];
  }

  private renderHuevosChart(huevosPorTipo: any): void {
    const tipos = Object.keys(huevosPorTipo);
    const conteos = Object.values(huevosPorTipo);

    const chart = new Chart('chartBarras', {
      type: 'bar',
      data: {
        labels: tipos.length ? tipos : ['Sin datos'],
        datasets: [{
          label: 'Cantidad de Huevos',
          data: conteos.length ? conteos : [0],
          backgroundColor: ['#9C27B0', '#4CAF50', '#81C784', '#FFEB3B', '#FF9800', '#F44336'],
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
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
          data: conteos.length ? conteos : [1],
          backgroundColor: ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
    });
    this.chartsInstantiated.push(chart);
  }

  private renderProduccionChart(produccionPorDia: any): void {
    // Ensure days are ordered
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const labels = [];
    const data = [];
    for (const dia of diasSemana) {
      if (produccionPorDia[dia] !== undefined) {
        labels.push(dia);
        data.push(produccionPorDia[dia]);
      }
    }

    const chart = new Chart('chartLinea', {
      type: 'line',
      data: {
        labels: labels.length ? labels : diasSemana,
        datasets: [{
          label: 'Producción',
          data: data.length ? data : [0,0,0,0,0,0,0],
          borderColor: '#2196F3',
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(33, 150, 243, 0.1)'
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    this.chartsInstantiated.push(chart);
  }

  private renderGallinasChart(estadoGallinas: any): void {
    const chart = new Chart('chartTorta', {
      type: 'pie',
      data: {
        labels: ['Activas', 'Finalizadas/Muertas'],
        datasets: [{
          data: [estadoGallinas.activas || 0, estadoGallinas.finalizadas || 0],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
    this.chartsInstantiated.push(chart);
  }
}
