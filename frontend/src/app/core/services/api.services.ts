import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService, extractData, extractArray } from './base-api.service';
import { environment } from '../../../environments/environment';
import {
  User, Role, Permission, RolePermission, Breed, Barn, Flock,
  EggType, EggInventory, Supply, SupplyCategory,
  MeasurementUnit, SupplyHistory, SupplyAction,
  Feeding, Report
} from '../models';

// ===== USERS =====
@Injectable({ providedIn: 'root' })
export class UsersService extends BaseApiService<User> {
  protected endpoint = 'users';

  setStatus(id: string, activo: boolean): Observable<User> {
    return this.http.patch<unknown>(`${this.baseUrl}/users/${id}/status`, { activo }).pipe(
      map((response) => extractData<User>(response)),
    );
  }
}

// ===== ROLES =====
@Injectable({ providedIn: 'root' })
export class RolesService extends BaseApiService<Role> {
  protected endpoint = 'roles';

  assignRole(data: { id_usuario: string; id_rol: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/roles/assign`, data);
  }

  removeRole(data: { id_usuario: string; id_rol: number }): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/roles/assign/remove`, { body: data });
  }

  getRolesByUser(id_usuario: string): Observable<Role[]> {
    return this.http.get<unknown>(`${this.baseUrl}/roles/user/${id_usuario}`).pipe(
      map(response => extractArray<Role>(response))
    );
  }

  updateRolePermissions(id_rol: number, permissionIds: number[]): Observable<Role> {
    return this.http.patch<unknown>(`${this.baseUrl}/roles/${id_rol}/permissions`, { permissionIds }).pipe(
      map(response => extractData<Role>(response)),
    );
  }
}

// ===== PERMISSIONS =====
@Injectable({ providedIn: 'root' })
export class PermissionsService extends BaseApiService<Permission> {
  protected endpoint = 'permissions';

  /**
   * Asigna un permiso individual a un rol
   * @param data - Objeto con id_rol e id_permiso
   * @returns Observable con la respuesta del servidor
   */
  assignPermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/permissions/assign`, data);
  }

  /**
   * Remueve un permiso individual de un rol
   * @param data - Objeto con id_rol e id_permiso a remover
   * @returns Observable con la respuesta del servidor
   */
  removePermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/permissions/assign/remove`, { body: data });
  }

  /**
   * Obtiene todos los permisos asignados a un rol específico
   * @param id_rol - ID del rol para consultar permisos
   * @returns Observable con array de permisos del rol
   */
  getPermissionsByRole(id_rol: number): Observable<Permission[]> {
    return this.http.get<unknown>(`${this.baseUrl}/permissions/rol/${id_rol}`).pipe(
      map(response => extractArray<RolePermission>(response)),
      map((assignments) => assignments.map((assignment) => assignment.permiso!)),
    );
  }

  /**
   * Obtiene la matriz completa de roles y permisos del sistema
   * @returns Observable con roles, permisos y sus asociaciones
   */
  getMatrix(): Observable<{ roles: Role[]; permissions: Permission[] }> {
    return this.http.get<unknown>(`${this.baseUrl}/permissions/matrix`).pipe(
      map(response => extractData<{ roles: Role[]; permissions: Permission[] }>(response)),
    );
  }

  /**
   * Actualiza todos los permisos asignados a un rol de forma atómica
   * 
   * DESCRIPCIÓN:
   * Este método sincroniza los permisos de un rol con una lista específica de IDs de permisos.
   * Realiza una actualización de la matriz de permisos del rol, reemplazando completamente
   * los permisos existentes con los nuevos especificados.
   * 
   * FLUJO:
   * 1. Envía un PATCH request al endpoint de roles con los nuevos IDs de permisos
   * 2. El backend realiza la sincronización (agrega permisos nuevos, remueve los no incluidos)
   * 3. Retorna el rol actualizado con su nueva lista de permisos
   * 
   * @param roleId - ID numérico del rol a actualizar (ejemplo: 1, 2, 3, etc.)
   * @param permissionIds - Array de IDs de permisos a asignar al rol (ejemplo: [1, 2, 5])
   *                        Si el array está vacío, se removerán todos los permisos del rol
   * 
   * @returns Observable<Role> - Observable que emite el rol actualizado con la nueva
   *                             configuración de permisos. Al suscribirse, espera la
   *                             respuesta exitosa del servidor.
   * 
   * @example
   * // Asignar permisos 1, 3 y 5 al rol 2
   * this.permissionsService.updateRolePermissions(2, [1, 3, 5]).subscribe({
   *   next: (updatedRole) => {
   *     console.log('Permisos actualizados:', updatedRole);
   *     this.toast.success('Permisos guardados exitosamente');
   *   },
   *   error: (error) => {
   *     console.error('Error al actualizar permisos:', error);
   *     this.toast.error('No se pudieron guardar los permisos');
   *   }
   * });
   */
  updateRolePermissions(roleId: number, permissionIds: number[]): Observable<Role> {
    return this.http.patch<unknown>(
      `${this.baseUrl}/roles/${roleId}/permissions`,
      { permissionIds }
    ).pipe(
      map(response => extractData<Role>(response)),
    );
  }
}

// ===== BREEDS =====
@Injectable({ providedIn: 'root' })
export class BreedsService extends BaseApiService<Breed> {
  protected endpoint = 'breeds';
}

// ===== BARNS =====
@Injectable({ providedIn: 'root' })
export class BarnsService extends BaseApiService<Barn> {
  protected endpoint = 'barns';
}

// ===== FLOCKS =====
@Injectable({ providedIn: 'root' })
export class FlocksService extends BaseApiService<Flock> {
  protected endpoint = 'flocks';

  assignFlock(data: unknown): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/asignar`, data);
  }

  registerDeadBirds(data: { id_lote: string; cantidad: number; fecha?: string; motivo?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/aves-muertas`, data);
  }

  finalizeFlock(data: { id_lote: string; fecha_fin?: string; observacion?: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/flocks/finalizar`, data);
  }
}

// ===== EGG TYPES =====
@Injectable({ providedIn: 'root' })
export class EggTypesService extends BaseApiService<EggType> {
  protected endpoint = 'egg-types';
}

// ===== EGG INVENTORY =====
@Injectable({ providedIn: 'root' })
export class EggInventoryService extends BaseApiService<EggInventory> {
  protected endpoint = 'egg-inventory';

  registerProduction(data: unknown): Observable<EggInventory> {
    return this.http.post<unknown>(`${this.url}/produccion`, data).pipe(
      map(response => extractData<EggInventory>(response))
    );
  }

  getProductionReport(periodo: 'semanal' | 'mensual' | 'trimestral', params?: Record<string, any>): Observable<import('../models').PaginatedResponse<any>> {
    return this.http.get<unknown>(`${this.url}/reporte/${periodo}`, { params }).pipe(
      map(response => extractData<import('../models').PaginatedResponse<any>>(response))
    );
  }

  registerDamaged(data: unknown): Observable<EggInventory> {
    return this.http.post<unknown>(`${this.url}/danados`, data).pipe(
      map(response => extractData<EggInventory>(response))
    );
  }
}

// ===== SUPPLY CATEGORIES =====
@Injectable({ providedIn: 'root' })
export class SupplyCategoriesService extends BaseApiService<SupplyCategory> {
  protected endpoint = 'supply-categories';
}

// ===== MEASUREMENT UNITS =====
@Injectable({ providedIn: 'root' })
export class MeasurementUnitsService extends BaseApiService<MeasurementUnit> {
  protected endpoint = 'measurement-units';
}

// ===== SUPPLIES =====
@Injectable({ providedIn: 'root' })
export class SuppliesService extends BaseApiService<Supply> {
  protected endpoint = 'supplies';
}

// ===== SUPPLY HISTORY =====
@Injectable({ providedIn: 'root' })
export class SupplyHistoryService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<SupplyHistory[]> {
    return this.http.get<unknown>(`${this.baseUrl}/supply-history`).pipe(
      map(response => extractArray<SupplyHistory>(response))
    );
  }

  getById(id: string): Observable<SupplyHistory> {
    return this.http.get<unknown>(`${this.baseUrl}/supply-history/${id}`).pipe(
      map(response => extractData<SupplyHistory>(response))
    );
  }

  getBySupply(idInsumo: string): Observable<SupplyHistory[]> {
    return this.http.get<unknown>(`${this.baseUrl}/supply-history/by-supply/${idInsumo}`).pipe(
      map(response => extractArray<SupplyHistory>(response))
    );
  }

  create(data: unknown): Observable<SupplyHistory> {
    return this.http.post<unknown>(`${this.baseUrl}/supply-history`, data).pipe(
      map(response => extractData<SupplyHistory>(response))
    );
  }
}

// ===== SUPPLY ACTIONS =====
@Injectable({ providedIn: 'root' })
export class SupplyActionsService extends BaseApiService<SupplyAction> {
  protected endpoint = 'supply-actions';
}

// ===== FEEDING =====
@Injectable({ providedIn: 'root' })
export class FeedingService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Feeding[]> {
    return this.http.get<unknown>(`${this.baseUrl}/alimentacion`).pipe(
      map(response => extractArray<Feeding>(response))
    );
  }

  getById(id: number): Observable<Feeding> {
    return this.http.get<unknown>(`${this.baseUrl}/alimentacion/${id}`).pipe(
      map(response => extractData<Feeding>(response))
    );
  }

  create(data: unknown): Observable<Feeding> {
    return this.http.post<unknown>(`${this.baseUrl}/alimentacion`, data).pipe(
      map(response => extractData<Feeding>(response))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/alimentacion/${id}`);
  }
}

// ===== REPORTS =====
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<Report[]> {
    return this.http.get<unknown>(`${this.baseUrl}/reports`).pipe(
      map(response => extractArray<Report>(response))
    );
  }

  getById(id: string): Observable<Report> {
    return this.http.get<unknown>(`${this.baseUrl}/reports/${id}`).pipe(
      map(response => extractData<Report>(response))
    );
  }

  create(data: unknown): Observable<Report> {
    return this.http.post<unknown>(`${this.baseUrl}/reports`, data).pipe(
      map(response => extractData<Report>(response))
    );
  }
}

// ===== DASHBOARD =====
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get<unknown>(`${this.baseUrl}/dashboard/stats`).pipe(
      map(response => extractData<any>(response))
    );
  }
}

// ===== BACKUP =====
@Injectable({ providedIn: 'root' })
export class BackupApiService {
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  createBackup(): Observable<any> {
    return this.http.get<unknown>(`${this.baseUrl}/configuracion/backup`).pipe(
      map(response => extractData<any>(response))
    );
  }

  listBackups(): Observable<any[]> {
    return this.http.get<unknown>(`${this.baseUrl}/configuracion/backups`).pipe(
      map(response => extractData<any[]>(response))
    );
  }

  restoreBackup(filename: string): Observable<any> {
    return this.http.post<unknown>(`${this.baseUrl}/configuracion/restore`, { filename }).pipe(
      map(response => extractData<any>(response))
    );
  }

  getDownloadUrl(): string {
    return `${this.baseUrl}/configuracion/backup/download`;
  }
}
