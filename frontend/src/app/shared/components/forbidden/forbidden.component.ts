import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="access-denied" style="min-height:100vh">
      <i class="fas fa-shield-alt"></i>
      <h2>Acceso Denegado</h2>
      <p>No tienes permisos para acceder a esta sección.</p>
      <a routerLink="/dashboard" class="btn-green" style="margin-top:2rem">
        <i class="fas fa-home"></i> Ir al Inicio
      </a>
    </div>
  `,
})
export class ForbiddenComponent {}
