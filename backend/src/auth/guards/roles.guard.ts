import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No tienes acceso para realizar esta acción');
    }

    let hasRole = true;
    if (requiredRoles && requiredRoles.length > 0) {
      if (!user.roles) throw new ForbiddenException('No tienes roles asignados');
      hasRole = requiredRoles.some((role) =>
        user.roles
          .map((r: string) => r.toLowerCase())
          .includes(role.toLowerCase()),
      );
    }

    let hasPermission = true;
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!user.permissions) throw new ForbiddenException('No tienes permisos asignados');
      hasPermission = requiredPermissions.some((perm) =>
        user.permissions
          .map((p: string) => p.toLowerCase())
          .includes(perm.toLowerCase()),
      );
    }

    if (!hasRole && !hasPermission) {
      throw new ForbiddenException(
        `No tienes permisos suficientes para esta acción`,
      );
    }
    
    // Si se especificaron roles pero no cumple
    if (requiredRoles && requiredRoles.length > 0 && !hasRole) {
      throw new ForbiddenException(`Requiere uno de los roles: [${requiredRoles.join(', ')}]`);
    }

    // Si se especificaron permisos pero no cumple
    if (requiredPermissions && requiredPermissions.length > 0 && !hasPermission) {
      throw new ForbiddenException(`Requiere el permiso: [${requiredPermissions.join(', ')}]`);
    }

    return true;
  }
}
