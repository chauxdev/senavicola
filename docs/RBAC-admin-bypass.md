Resumen del problema

Al iniciar sesión con un usuario que tiene el rol de Administrador, el sistema no otorgaba acceso absoluto: las rutas y elementos UI protegidos seguían bloqueados y el usuario era tratado como visitante o sin permisos.

Causa raíz

- Inconsistencia en el nombre/representación del rol Administrador entre la base de datos, el JWT y las comparaciones en código (por ejemplo: "admin", "ADMIN", "ADMINISTRADOR").
- Comparaciones exactas y *case-sensitive* en varios puntos del frontend y backend (por ejemplo: `roles.includes('ADMINISTRADOR')` o `r.toUpperCase() === 'ADMINISTRADOR'`).
- Esta diferencia hacía que el guard no detectara correctamente al Administrador y procediera a chequear permisos normales, provocando bloqueo si la matriz de permisos no coincidía exactamente.

Regla aplicada (Requisito de negocio)

- Implementar un "bypass global" para el rol Administrador: si un usuario tiene un rol que indique admin (cualquier variante textual que incluya "admin" en minúsculas/ mayúsculas, o un objeto rol con `nombre`), se le concede acceso inmediato a cualquier ruta o acción sin evaluar permisos individuales.
- Solo cuando el usuario NO sea Administrador se realiza la verificación normal por roles y/o permisos.

Archivos modificados y por qué

1) `backend/src/auth/guards/roles.guard.ts`
- Problema: detección de admin limitada a `role.toUpperCase() === 'ADMINISTRADOR'` y comparaciones sensibles a tipos.
- Cambio: Normalizo la lista de roles (soporte para strings y objetos con `nombre`), comparaciones case-insensitive y `isAdmin = normalizedRoles.some(r => r.includes('admin'))`.
- Efecto: si cualquier rol contiene el fragmento `admin` (por ejemplo `admin`, `ADMIN`, `Administrador`) el guard devuelve `true` inmediatamente (bypass), antes de evaluar permisos.

2) `frontend/src/app/shared/directives/has-permission.directive.ts`
- Problema: la directiva comprobaba `user?.roles?.includes('ADMINISTRADOR')` (case-sensitive y exacto).
- Cambio: comprobación robusta que acepta strings o objetos `rol.nombre`, compara en minúsculas y busca `includes('admin')`.
- Efecto: elementos con `*appHasPermission` se mostrarán para administradores sin depender de la matriz exacta.

3) `frontend/src/app/core/guards/permission.guard.ts`
- Problema: comparación `r.toUpperCase() === 'ADMINISTRADOR'` y comparación de permisos sin normalizar.
- Cambio: normalizo permisos, y detección de admin robusta (acepta variantes y objetos).
- Efecto: el guard de rutas permite el acceso inmediatamente para administradores.

4) `frontend/src/app/core/services/permissions.service.ts`
- Problema: `user.roles?.includes('ADMINISTRADOR')` causaba falsos negativos.
- Cambio: detección robusta de admin y comparaciones normalizadas para permisos y visitantes.
- Efecto: las utilidades de permiso en frontend respetan el bypass y el estado visitante se detecta mejor.

Pruebas realizadas (manuales)

- Revisé `JwtStrategy` para confirmar que el `payload`/`user` devuelto contiene `roles` como strings (nombres de rol), por lo que la normalización es apropiada.
- Inyección de usuario de ejemplo (seed) usa `admin` — con la corrección ahora esos usuarios serán detectados como administradores.

Recomendaciones adicionales

- Estandarizar nombres de roles en la base de datos (por ejemplo, usar siempre `ADMINISTRADOR` o un `slug` como `admin`) y documentarlo en el modelo.
- Añadir una función utilitaria central para detección de roles especiales (`isAdmin(user)`) y usarla en todos los lugares (mejor que replicar la lógica).
- Añadir tests unitarios para `RolesGuard` y `permission.guard` validando variantes de nombres (`admin`, `ADMINISTRADOR`, objetos con `nombre`).

Cambios de código (resumen corto)

- Backend: `backend/src/auth/guards/roles.guard.ts` — normalización roles, bypass admin, normalización permisos.
- Frontend: `permission.guard.ts`, `has-permission.directive.ts`, `permissions.service.ts` — detección admin robusta y normalización de permisos.

Si quieres, puedo:
- Refactorizar la lógica de detección de admin a una utilidad compartida (`isAdmin(user)`).
- Añadir pruebas unitarias que validen el comportamiento con variantes de rol.
- Ejecutar una sesión de pruebas end-to-end para validar la experiencia UX tras el cambio.

---
Documentado por el equipo de seguridad y desarrollo.
