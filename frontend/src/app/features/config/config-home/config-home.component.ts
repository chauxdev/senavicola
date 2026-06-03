import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ConfigCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-config-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="config-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-cog"></i></div>
          <div>
            <h2>Configuración del Sistema</h2>
            <p>Gestiona parámetros, usuarios y preferencias del sistema</p>
          </div>
        </div>
      </div>

      <div class="config-section">
        <h3 class="section-title"><i class="fas fa-users-cog"></i> Gestión de Acceso</h3>
        <div class="config-grid">
          @for (card of accessCards; track card.route) {
            <a [routerLink]="card.route" class="config-card">
              <div class="config-card-icon" [style.background]="card.color">
                <i class="fas {{ card.icon }}"></i>
              </div>
              <h4>{{ card.title }}</h4>
              <p>{{ card.description }}</p>
              <span class="config-link">Gestionar <i class="fas fa-arrow-right"></i></span>
            </a>
          }
        </div>
      </div>

      <div class="config-section">
        <h3 class="section-title"><i class="fas fa-sliders-h"></i> Parámetros del Sistema</h3>
        <div class="config-grid">
          @for (card of paramCards; track card.route) {
            <a [routerLink]="card.route" class="config-card">
              <div class="config-card-icon" [style.background]="card.color">
                <i class="fas {{ card.icon }}"></i>
              </div>
              <h4>{{ card.title }}</h4>
              <p>{{ card.description }}</p>
              <span class="config-link">Gestionar <i class="fas fa-arrow-right"></i></span>
            </a>
          }
        </div>
      </div>

      <div class="config-section">
        <h3 class="section-title"><i class="fas fa-tools"></i> Mantenimiento</h3>
        <div class="config-grid">
          @for (card of maintenanceCards; track card.route) {
            <a [routerLink]="card.route" class="config-card">
              <div class="config-card-icon" [style.background]="card.color">
                <i class="fas {{ card.icon }}"></i>
              </div>
              <h4>{{ card.title }}</h4>
              <p>{{ card.description }}</p>
              <span class="config-link">Gestionar <i class="fas fa-arrow-right"></i></span>
            </a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-section { margin-bottom: 3rem; }
    .section-title {
      font-size: 1.6rem; font-weight: 700; color: var(--text-dark);
      margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;
      i { color: var(--primary-green); }
    }
    .config-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    .config-card {
      background: white; border-radius: var(--border-radius-lg);
      padding: 2rem 1.8rem; box-shadow: var(--shadow-sm);
      text-decoration: none; color: var(--text-dark);
      display: flex; flex-direction: column; gap: 0.8rem;
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    }
    .config-card-icon {
      width: 5rem; height: 5rem; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 2.2rem;
    }
    .config-card h4 { font-size: 1.5rem; font-weight: 700; }
    .config-card p { font-size: 1.3rem; color: var(--gray-dark); flex: 1; }
    .config-link {
      font-size: 1.3rem; color: var(--primary-green); font-weight: 600;
      display: flex; align-items: center; gap: 0.5rem;
    }
  `],
})
export class ConfigHomeComponent {
  accessCards: ConfigCard[] = [
    { title: 'Usuarios', description: 'Administra los usuarios del sistema', icon: 'fa-users', route: '/config/users', color: 'linear-gradient(135deg,#2196F3,#0d47a1)' },
    { title: 'Roles', description: 'Gestiona los roles disponibles', icon: 'fa-user-tag', route: '/config/roles', color: 'linear-gradient(135deg,#9C27B0,#4a148c)' },
    { title: 'Permisos', description: 'Asigna permisos a roles', icon: 'fa-key', route: '/config/permissions', color: 'linear-gradient(135deg,#FF9800,#e65100)' },
  ];

  paramCards: ConfigCard[] = [
    { title: 'Razas', description: 'Tipos de razas de gallinas', icon: 'fa-dna', route: '/config/breeds', color: 'linear-gradient(135deg,#39A900,#2d8600)' },
    { title: 'Galpones', description: 'Configuración de galpones', icon: 'fa-warehouse', route: '/config/barns', color: 'linear-gradient(135deg,#00BCD4,#006064)' },
    { title: 'Tipos de Huevo', description: 'Clasificación de tipos de huevo', icon: 'fa-egg', route: '/config/egg-types', color: 'linear-gradient(135deg,#FF9800,#e65100)' },
    { title: 'Unidades de Medida', description: 'Unidades para insumos', icon: 'fa-ruler', route: '/config/measurement-units', color: 'linear-gradient(135deg,#2196F3,#0d47a1)' },
    { title: 'Categorías de Insumos', description: 'Clasificación de insumos', icon: 'fa-tags', route: '/config/supply-categories', color: 'linear-gradient(135deg,#E91E63,#880e4f)' },
    { title: 'Acciones de Insumos', description: 'Tipos de acciones sobre insumos', icon: 'fa-tasks', route: '/config/supply-actions', color: 'linear-gradient(135deg,#795548,#3e2723)' },
  ];

  maintenanceCards: ConfigCard[] = [
    { title: 'Backup y Restauración', description: 'Crear y restaurar copias de seguridad', icon: 'fa-database', route: '/config/backup', color: 'linear-gradient(135deg,#607D8B,#37474F)' },
  ];
}
