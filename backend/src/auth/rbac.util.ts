export const BASE_ROLES = {
  ADMIN: 'admin',
  APRENDIZ: 'aprendiz',
  VISITANTE: 'visitante',
} as const;

export const PROTECTED_ROLE_NAMES = [
  BASE_ROLES.ADMIN,
  BASE_ROLES.APRENDIZ,
  BASE_ROLES.VISITANTE,
] as const;

export function normalizeRoleName(role: unknown): string {
  if (!role) return '';
  if (typeof role === 'string') return role.trim().toLowerCase();
  if (typeof role === 'object' && role !== null && 'nombre' in role) {
    return String((role as { nombre: unknown }).nombre).trim().toLowerCase();
  }
  return String(role).trim().toLowerCase();
}

export function normalizePermissionName(permission: unknown): string {
  if (!permission) return '';
  return String(permission).trim().toLowerCase();
}

export function isAdminRole(role: unknown): boolean {
  return normalizeRoleName(role) === BASE_ROLES.ADMIN;
}

export function isAdminUserRoles(roles: unknown[] | undefined): boolean {
  if (!Array.isArray(roles)) return false;
  return roles.some((role) => isAdminRole(role));
}

export function hasRoleName(
  roles: unknown[] | undefined,
  roleName: string,
): boolean {
  if (!Array.isArray(roles)) return false;
  const target = normalizeRoleName(roleName);
  return roles.some((role) => normalizeRoleName(role) === target);
}

export function isVisitorRole(roles: unknown[] | undefined): boolean {
  return hasRoleName(roles, BASE_ROLES.VISITANTE);
}

export function isAprendizRole(roles: unknown[] | undefined): boolean {
  return hasRoleName(roles, BASE_ROLES.APRENDIZ);
}

export function isReadOnlyBaseRole(roles: unknown[] | undefined): boolean {
  return isVisitorRole(roles) || isAprendizRole(roles);
}

export function isReadHttpMethod(method: string | undefined): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(String(method || '').toUpperCase());
}

export function isMutationHttpMethod(method: string | undefined): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    String(method || '').toUpperCase(),
  );
}

export function extractPermissionsFromUser(user: {
  usuarioRoles?: Array<{
    rol?: {
      rolPermisos?: Array<{ permiso?: { nombre?: string } | null } | null>;
    } | null;
  } | null>;
}): string[] {
  const permissions = new Set<string>();
  user.usuarioRoles?.forEach((userRole) => {
    userRole?.rol?.rolPermisos?.forEach((rolePermission) => {
      if (rolePermission?.permiso?.nombre) {
        permissions.add(rolePermission.permiso.nombre);
      }
    });
  });
  return Array.from(permissions);
}

export function extractRoleNamesFromUser(user: {
  roles?: Array<{ nombre?: string } | string>;
  usuarioRoles?: Array<{ rol?: { nombre?: string } | null } | null>;
}): string[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles
      .map((role) =>
        typeof role === 'string' ? role : role?.nombre || '',
      )
      .filter(Boolean);
  }

  return (
    user.usuarioRoles
      ?.map((userRole) => userRole?.rol?.nombre)
      .filter((roleName): roleName is string => typeof roleName === 'string') ||
    []
  );
}

/**
 * Comprueba acceso a un permiso concreto o a nivel de módulo completo.
 * Ej: tener el permiso "LOTES" concede todas las acciones "LOTES_*".
 */
export function hasPermissionAccess(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  const normalizedRequired = normalizePermissionName(requiredPermission);
  const normalizedUserPermissions = userPermissions.map(normalizePermissionName);

  if (normalizedUserPermissions.includes(normalizedRequired)) {
    return true;
  }

  const modulePrefix = normalizedRequired.includes('_')
    ? normalizedRequired.substring(0, normalizedRequired.lastIndexOf('_'))
    : normalizedRequired;

  return (
    !!modulePrefix &&
    normalizedUserPermissions.includes(modulePrefix)
  );
}

export function isReadPermission(permission: string): boolean {
  const normalized = normalizePermissionName(permission);
  return normalized.endsWith('_ver') || normalized === 'configuracion_ver';
}
