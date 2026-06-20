import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { isAdminUser } from '../utils/rbac.util';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private authService = inject(AuthService);

  hasPermission(permissionName: string): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    if (isAdminUser(user)) return true;
    return (user.permissions || []).some((p: any) => String(p) === String(permissionName));
  }

  isVisitor(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return (Array.isArray(user.roles) && user.roles.some((r: any) => String(r).toLowerCase().includes('visitante'))) || user.id_usuario === 'guest';
  }

  canWrite(): boolean {
    return !this.isVisitor();
  }
}
