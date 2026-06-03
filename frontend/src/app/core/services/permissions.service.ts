import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private authService = inject(AuthService);

  hasPermission(permissionName: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    // Si tiene el rol administrador, tiene todos los permisos
    if (user.roles?.includes('ADMINISTRADOR')) return true;
    return user.permissions?.includes(permissionName) || false;
  }

  isVisitor(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return user.roles?.includes('VISITANTE') || user.id_usuario === 'guest';
  }

  canWrite(): boolean {
    return !this.isVisitor();
  }
}
