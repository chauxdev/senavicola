import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { RbacService } from '../rbac.service';
import {
  hasPermissionAccess,
  isAdminUserRoles,
  isAprendizRole,
  isMutationHttpMethod,
  isReadHttpMethod,
  isVisitorRole,
  normalizeRoleName,
} from '../rbac.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request as { user?: Record<string, unknown> };

    if (!user) {
      throw new ForbiddenException('No tienes acceso para realizar esta acción');
    }

    const rbacService = this.moduleRef.get(RbacService, { strict: false });
    if (!rbacService) {
      throw new ForbiddenException('Sistema de autorización no disponible');
    }

    const authorization = await rbacService.resolveAuthorization({
      id_usuario: user.id_usuario as string | undefined,
      sub: user.sub as string | undefined,
    });

    request.user = {
      ...user,
      roles: authorization.roles,
      permissions: authorization.permissions,
    };

    if (isAdminUserRoles(authorization.roles)) {
      return true;
    }

    const httpMethod = String(request.method || '');
    const isReadRequest = isReadHttpMethod(httpMethod);
    const isMutationRequest = isMutationHttpMethod(httpMethod);

    if (isMutationRequest && isVisitorRole(authorization.roles)) {
      throw new ForbiddenException(
        'El rol visitante no puede ejecutar acciones de escritura, edición o borrado',
      );
    }

    if (
      isReadRequest &&
      requiredPermissions?.length &&
      (isVisitorRole(authorization.roles) || isAprendizRole(authorization.roles))
    ) {
      return true;
    }

    let hasRole = true;
    if (requiredRoles?.length) {
      const normalizedRoles = authorization.roles.map(normalizeRoleName);
      if (!normalizedRoles.length) {
        throw new ForbiddenException('No tienes roles asignados');
      }

      hasRole = requiredRoles.some((role) =>
        normalizedRoles.includes(normalizeRoleName(role)),
      );
    }

    let hasPermission = true;
    if (requiredPermissions?.length) {
      if (!authorization.permissions.length) {
        throw new ForbiddenException('No tienes permisos asignados');
      }

      hasPermission = requiredPermissions.some((permission) =>
        hasPermissionAccess(authorization.permissions, permission),
      );
    }

    if (requiredRoles?.length && requiredPermissions?.length) {
      if (!hasRole && !hasPermission) {
        throw new ForbiddenException('No tienes permisos suficientes para esta acción');
      }
    } else if (requiredRoles?.length && !hasRole) {
      throw new ForbiddenException(
        `Requiere uno de los roles: [${requiredRoles.join(', ')}]`,
      );
    } else if (requiredPermissions?.length && !hasPermission) {
      throw new ForbiddenException(
        `Requiere el permiso: [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
