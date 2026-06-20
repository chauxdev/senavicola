import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { AccessDeniedService } from '../services/access-denied.service';
import { isAdminUser, normalizePermissionName } from '../utils/rbac.util';

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessDenied = inject(AccessDeniedService);

  const permission = route.data['permission'] as string | string[] | undefined;
  const user = authService.currentUser();

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!permission) {
    return true;
  }

  const requiredPermissions = Array.isArray(permission) ? permission : [permission];
  const normalizedPerms = (user?.permissions || []).map((p) => normalizePermissionName(p));
  const hasPermission = requiredPermissions.some((perm) => normalizedPerms.includes(normalizePermissionName(perm)));

  const isAdmin = isAdminUser(user);

  if (hasPermission || isAdmin) {
    return true;
  }

  accessDenied.open();
  return false;
};
