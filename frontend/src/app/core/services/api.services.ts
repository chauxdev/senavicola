import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BaseApiService, extractData, extractArray } from './base-api.service';
import { environment } from '../../../environments/environment';
import {
  User, Role, Permission, Breed, Barn, Flock,
  EggType, EggInventory, Supply, SupplyCategory,
  MeasurementUnit, SupplyHistory, SupplyAction,
  Feeding, Report
} from '../models';

// ===== USERS =====
@Injectable({ providedIn: 'root' })
export class UsersService extends BaseApiService<User> {
  protected endpoint = 'users';
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
}

// ===== PERMISSIONS =====
@Injectable({ providedIn: 'root' })
export class PermissionsService extends BaseApiService<Permission> {
  protected endpoint = 'permissions';

  assignPermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/permissions/assign`, data);
  }

  removePermission(data: { id_rol: number; id_permiso: number }): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/permissions/assign/remove`, { body: data });
  }

  getPermissionsByRole(id_rol: number): Observable<Permission[]> {
    return this.http.get<unknown>(`${this.baseUrl}/permissions/rol/${id_rol}`).pipe(
      map(response => extractArray<Permission>(response))
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
