export function normalizeRoleName(role: unknown): string {
  if (!role) return '';
  if (typeof role === 'string') return role.trim().toLowerCase();
  if (typeof role === 'object' && role !== null && 'nombre' in role) {
    return String((role as any).nombre).trim().toLowerCase();
  }
  return String(role).trim().toLowerCase();
}

export function isAdminUser(user: { roles?: unknown[] } | null | undefined): boolean {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((role) => normalizeRoleName(role).includes('admin'));
}

export function normalizePermissionName(permission: unknown): string {
  if (!permission) return '';
  return String(permission).trim().toLowerCase();
}
