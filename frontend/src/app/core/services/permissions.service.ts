import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { isAdminUser } from '../utils/rbac.util';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  /** Prevents duplicate toasts within a 500ms window */
  private _alertSuppressed = false;

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

  /**
   * Shows "No tiene permiso para realizar esta acción" exactly ONCE
   * per user action (debounced 500ms). Call this from every guard/button
   * that detects a visitor attempting a write action.
   */
  showUnauthorizedMessage(): void {
    if (this._alertSuppressed) return;
    this._alertSuppressed = true;
    this.toast.error('No tiene permiso para realizar esta acción');
    setTimeout(() => { this._alertSuppressed = false; }, 500);
  }
}

