import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PermissionsService } from '../../../core/services/permissions.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Header Superior -->
    <header class="header-superior">
      <div class="header-left">
        <button class="btn-menu" (click)="toggleSidebar()">
          <i class="fas fa-bars"></i>
        </button>
        <h1>Sistema Avícola</h1>
      </div>
      <div class="header-right">
        <div class="user-card" (click)="toggleUserMenu()">
          <i class="fas fa-user"></i>
          <div class="user-info">
            <div class="user-name">{{ currentUser()?.nombre || 'Usuario' }}</div>
            <div class="user-role">{{ getUserRole() }}</div>
          </div>
          <i class="fas fa-chevron-down" style="font-size:1.2rem;margin-left:0.5rem"></i>
        </div>
        @if (showUserMenu()) {
          <div class="user-dropdown">
            <button (click)="openProfileModal()" class="dropdown-item">
              <i class="fas fa-user-cog"></i> Mi Perfil
            </button>
            <hr>
            <button (click)="openLogoutModal()" class="dropdown-item text-danger">
              <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
          </div>
        }
      </div>
    </header>

    <div class="main-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.hidden]="sidebarHidden()">
        <nav>
          <ul>
            @for (item of navItems(); track item.route) {
              <li>
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-link">
                  <i class="fas {{ item.icon }}"></i>
                  {{ item.label }}
                </a>
              </li>
            }
            <li>
              <button class="nav-link" style="width:100%;text-align:left;background:none;border:none" (click)="openLogoutModal()">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Page Content -->
      <main class="page-content" [class.sidebar-collapsed]="sidebarHidden()">
        <router-outlet />
      </main>
    </div>

    @if (showProfileModal()) {
      <div class="modal-overlay" (click)="closeProfileModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-id-badge"></i> Mi Perfil</h3>
            <button class="btn-close" (click)="closeProfileModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="profile-info" style="font-size: 1.4rem;">
              <p><strong>Nombre:</strong> {{ currentUser()?.nombre }}</p>
              <p><strong>Documento:</strong> {{ currentUser()?.numero_documento }}</p>
              <p><strong>Roles:</strong> {{ getUserRole() }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-green" (click)="closeProfileModal()">Cerrar</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal de Cerrar Sesión -->
    @if (showLogoutModal()) {
      <div class="modal-overlay" (click)="closeLogoutModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-sign-out-alt" style="color: var(--danger);"></i> Cerrar Sesión</h3>
            <button class="btn-close" (click)="closeLogoutModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div style="text-align: center; padding: 1rem 0;">
              <i class="fas fa-sign-out-alt" style="font-size: 4rem; color: var(--danger); margin-bottom: 1.5rem; display: block;"></i>
              <h3 style="font-size: 1.8rem; margin-bottom: 1rem;">¿Estás seguro?</h3>
              <p style="font-size: 1.4rem; color: var(--gray-dark);">¿Deseas cerrar tu sesión actual?</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeLogoutModal()">Cancelar</button>
            <button class="btn-danger" (click)="confirmLogout()">
              <i class="fas fa-sign-out-alt"></i> Salir
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .user-dropdown {
      position: absolute;
      top: calc(var(--header-height) - 0.5rem);
      right: 1.5rem;
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 1001;
      min-width: 18rem;
      padding: 0.5rem 0;

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem 1.8rem;
        font-size: 1.4rem;
        color: var(--text-dark);
        cursor: pointer;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        font-family: 'Work Sans', sans-serif;
        transition: background 0.2s;

        &:hover { background: var(--gray-light); }
        &.text-danger { color: var(--danger); }
      }

      hr { border: none; border-top: 1px solid var(--gray-medium); margin: 0.3rem 0; }
    }

    .header-right { position: relative; }
  `],
})
export class LayoutComponent {
  private authService = inject(AuthService);
  private permissionsService = inject(PermissionsService);
  currentUser = this.authService.currentUser;
  sidebarHidden = signal(false);
  showUserMenu = signal(false);
  showProfileModal = signal(false);
  showLogoutModal = signal(false);

  allNavItems: NavItem[] = [
    { label: 'Inicio', icon: 'fa-home', route: '/dashboard' },
    { label: 'Gestión de Gallinas', icon: 'fa-dove', route: '/flocks' },
    { label: 'Gestión de Huevos', icon: 'fa-egg', route: '/eggs' },
    { label: 'Gestión de Insumos', icon: 'fa-box', route: '/supplies' },
    { label: 'Reportes', icon: 'fa-chart-bar', route: '/reports' },
    { label: 'Configuración', icon: 'fa-cog', route: '/config' },
  ];

  navItems = computed(() => {
    // Re-evaluate whenever currentUser changes
    this.currentUser();
    return this.allNavItems.filter(item => {
      if (item.route === '/dashboard') return true;
      if (item.route === '/flocks') return this.permissionsService.hasPermission('LOTES_VER') || this.permissionsService.hasPermission('GALPONES_VER') || this.permissionsService.hasPermission('RAZAS_VER');
      if (item.route === '/eggs') return this.permissionsService.hasPermission('HUEVOS_VER');
      if (item.route === '/supplies') return this.permissionsService.hasPermission('INSUMOS_VER') || this.permissionsService.hasPermission('CATEGORIAS_VER');
      if (item.route === '/reports') return this.permissionsService.hasPermission('REPORTES_VER');
      if (item.route === '/config') return this.permissionsService.hasPermission('CONFIGURACION_VER') || this.permissionsService.hasPermission('USUARIOS_VER') || this.permissionsService.hasPermission('ROLES_VER');
      return false;
    });
  });

  toggleSidebar(): void { this.sidebarHidden.update((v) => !v); }
  toggleUserMenu(): void { this.showUserMenu.update((v) => !v); }

  getUserRole(): string {
    const user = this.currentUser();
    if (!user?.roles?.length) return 'Usuario';
    return user.roles.join(', ');
  }

  openProfileModal(): void {
    this.showUserMenu.set(false);
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  openLogoutModal(): void {
    this.showUserMenu.set(false);
    this.showLogoutModal.set(true);
  }

  closeLogoutModal(): void {
    this.showLogoutModal.set(false);
  }

  confirmLogout(): void {
    this.showLogoutModal.set(false);
    this.authService.logout();
  }
}
