import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RolesService, PermissionsService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Role, Permission } from '../../../core/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="roles-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-user-tag"></i></div>
          <div><h2>Gestión de Roles</h2><p>Administra los roles del sistema.</p></div>
        </div>
        <div class="module-header-right">
          <a routerLink="/config" class="btn-outline"><i class="fas fa-arrow-left"></i> Volver</a>
          <button class="btn-green" (click)="openModal()"><i class="fas fa-plus"></i> Nuevo Rol</button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>Roles del Sistema</h3>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar..." [(ngModel)]="searchQuery" (input)="filter()" />
          </div>
        </div>
        @if (loading()) { <div class="loading-container"><div class="spinner"></div></div> }
        @else if (filtered().length === 0) {
          <div class="empty-state"><i class="fas fa-user-tag"></i><h3>No hay roles registrados</h3></div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th style="width: 60px;">#</th><th>Nombre</th><th>Descripción</th><th style="text-align: right; width: 120px;">Acciones</th></tr></thead>
              <tbody>
                @for (role of filtered(); track role.id_rol; let idx = $index) {
                  <tr>
                    <td><strong>{{ idx + 1 }}</strong></td>
                    <td><strong>{{ role.nombre }}</strong></td>
                    <td>{{ role.descripcion || '—' }}</td>
                    <td class="actions-cell" style="justify-content: flex-end;">
                      <button class="btn-icon edit" (click)="editRole(role)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon delete" (click)="deleteRole(role.id_rol)"><i class="fas fa-trash"></i></button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user-tag"></i> {{ editing() ? 'Editar Rol' : 'Nuevo Rol' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="roleForm">
              <div class="form-group">
                <label><i class="fas fa-user-tag"></i> Nombre del Rol</label>
                <input type="text" formControlName="nombre" placeholder="Ej: Administrador" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Descripción</label>
                <textarea formControlName="descripcion" placeholder="Descripción del rol..." rows="3"></textarea>
              </div>
              <div class="form-group">
                <label><i class="fas fa-lock"></i> Permisos</label>
                <div class="permissions-filters" style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem">
                  <input class="input_busqueda" placeholder="Buscar permiso..." [(ngModel)]="permissionFilter" [ngModelOptions]="{standalone: true}" (input)="onFilterChange()" />
                  <select [(ngModel)]="moduleFilter" [ngModelOptions]="{standalone: true}" (change)="onFilterChange()">
                    <option value="all">Todos los módulos</option>
                    <option value="usuarios">Usuarios</option>
                    <option value="roles">Roles y Permisos</option>
                    <option value="lotes">Lotes/Gallinas</option>
                    <option value="galpones">Galpones</option>
                    <option value="huevos">Huevos</option>
                    <option value="insumos">Insumos</option>
                    <option value="reportes">Reportes y Backup</option>
                  </select>
                </div>

                <div class="permissions-accordion">
                  @for (g of permissionGroups; track g.key) {
                    @if (filteredGroupPerms(g).length > 0) {
                      <div class="perm-group">
                        <div class="perm-group-header">
                          <input class="group-checkbox" type="checkbox" [checked]="isGroupChecked(g)" (change)="toggleGroupCheckbox(g, $event.target.checked)" />
                          <strong class="perm-group-title">{{ g.label }}</strong>
                          <button class="accordion-toggle" (click)="toggleGroup(g.key)">{{ g.expanded ? '-' : '+' }}</button>
                        </div>
                        @if (g.expanded) {
                          <div class="perm-group-body">
                            @for (perm of filteredGroupPerms(g); track perm.id_permiso) {
                              <label class="permission-item">
                                <input type="checkbox" [checked]="selectedPermissionIds().includes(perm.id_permiso)" (change)="togglePermission(perm.id_permiso, $event.target.checked)" />
                                <span class="permission-label">{{ perm.nombre }}</span>
                              </label>
                            }
                          </div>
                        }
                      </div>
                    }
                  }
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="save()"><i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Crear' }}</button>
          </div>
        </div>
      </div>
    }

    <!-- permissions are now managed inside the Edit Role modal -->
  `,
  styles: [`
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse;
      th { padding: 1.2rem 1.5rem; background: var(--gray-light); font-size: 1.2rem; font-weight: 600; text-transform: uppercase; color: var(--gray-dark); text-align: left; }
      td { padding: 1.2rem 1.5rem; border-top: 1px solid var(--gray-medium); font-size: 1.4rem; }
    }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
    .role-chips { display: flex; flex-wrap: wrap; gap: 0.8rem; }
    .chip-remove { background: none; border: none; cursor: pointer; color: inherit; margin-left: 0.4rem; }
    .permissions-grid { display: grid; gap: 0.8rem; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); margin-top: 1rem; }
    .permission-item { display: flex; align-items: center; gap: 0.7rem; border: 1px solid var(--gray-light); border-radius: 0.6rem; padding: 0.9rem 1rem; background: var(--white); cursor: pointer; }
    .permission-item input { width: 1.3rem; height: 1.3rem; accent-color: var(--primary-green); }
    .permissions-accordion { display:flex; flex-direction:column; gap:0.8rem; overflow-y:auto; padding:0.25rem; }
    .perm-group { border:1px solid var(--gray-light); border-radius:8px; overflow:hidden; }
    .perm-group-header { display:flex; align-items:center; gap:0.6rem; padding:0.6rem 1rem; background: linear-gradient(180deg, #fff, #fafafa); }
    .perm-group-header .group-checkbox { width:1.25rem; height:1.25rem; accent-color: var(--primary-green); }
    .perm-group-title { margin-left:0.6rem; font-weight:700; }
    .perm-group-body { padding:1rem 1.2rem; display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px; background: #fff; }
    .permission-label { display:block; }
    .accordion-toggle { margin-left:auto; background:none; border:none; font-size:1.1rem; cursor:pointer; }
  `],
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);

  loading = signal(true);
  roles = signal<Role[]>([]);
  filtered = signal<Role[]>([]);
  allPermissions = signal<Permission[]>([]);
  
  selectedPermissionIds = signal<number[]>([]);
  searchQuery = '';
  showModal = signal(false);
  editing = signal<Role | null>(null);
  selectedRole = signal<Role | null>(null);
  
  saving = signal(false);

  // Permission UI state
  permissionFilter = '';
  moduleFilter: string = 'all';

  // Define logical groups and the permission names that belong to each
  permissionGroups: Array<{ key: string; label: string; names: string[]; expanded?: boolean }> = [
    { key: 'usuarios', label: 'Usuarios', names: ['USUARIOS_VER','USUARIOS_CREAR','USUARIOS_EDITAR','USUARIOS_DESACTIVAR','USUARIOS_ELIMINAR'], expanded: true },
    { key: 'roles', label: 'Roles y Permisos', names: ['ROLES_VER','ROLES_CREAR','ROLES_EDITAR','ROLES_ELIMINAR'], expanded: true },
    { key: 'lotes', label: 'Lotes/Gallinas', names: ['LOTES_VER','LOTES_CREAR','LOTES_EDITAR','LOTES_ELIMINAR'], expanded: false },
    { key: 'galpones', label: 'Galpones', names: ['GALPONES_VER','GALPONES_CREAR','GALPONES_EDITAR','GALPONES_ELIMINAR'], expanded: false },
    { key: 'huevos', label: 'Huevos', names: ['HUEVOS_VER','HUEVOS_CREAR','HUEVOS_EDITAR'], expanded: false },
    { key: 'insumos', label: 'Insumos', names: ['INSUMOS_VER','INSUMOS_CREAR','INSUMOS_EDITAR','INSUMOS_ELIMINAR'], expanded: false },
    { key: 'reportes', label: 'Reportes y Backup', names: ['REPORTES_VER','BACKUP_GESTIONAR'], expanded: false },
  ];
  onFilterChange(): void {
    // Force Angular change detection by reassigning the array reference
    this.permissionGroups = [...this.permissionGroups];
  }

  toggleGroup(key: string): void {
    this.permissionGroups = this.permissionGroups.map(g => g.key === key ? { ...g, expanded: !g.expanded } : g);
  }

  // Returns permissions in a group applying top-level filters (robust against casing)
  filteredGroupPerms(group: any) {
    const all = this.allPermissions() || [];
    // normalize names to upper-case for reliable matching against group.names
    let perms = all.filter(p => group.names.includes(String(p.nombre || '').toUpperCase()));
    // text search: search in nombre and descripcion
    if (this.permissionFilter && String(this.permissionFilter).trim() !== '') {
      const q = this.permissionFilter.toLowerCase();
      perms = perms.filter(p => {
        const name = String(p.nombre || '').toLowerCase();
        const desc = String(p.descripcion || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }
    // module filter: if a specific module is selected, only return when group matches
    if (this.moduleFilter && this.moduleFilter !== 'all' && group.key !== this.moduleFilter) {
      return [];
    }
    return perms;
  }

  isGroupChecked(group: any): boolean {
    const perms = this.filteredGroupPerms(group);
    if (!perms.length) return false;
    return perms.every(p => this.selectedPermissionIds().includes(p.id_permiso));
  }

  toggleGroupCheckbox(group: any, checked: boolean): void {
    const perms = this.filteredGroupPerms(group);
    this.selectedPermissionIds.update(ids => {
      const idsSet = new Set(ids);
      perms.forEach((p: any) => {
        if (checked) idsSet.add(p.id_permiso);
        else idsSet.delete(p.id_permiso);
      });
      return Array.from(idsSet);
    });
  }

  roleForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit(): void {
    // Load permissions first so the modal can render grouped permissions immediately
    this.permissionsService.getAll().subscribe({
      next: (p) => this.allPermissions.set(p),
      error: () => this.allPermissions.set([]),
      complete: () => this.loadRoles(),
    });
  }

  private loadRoles(): void {
    this.rolesService.getAll().subscribe({
      next: (data) => { this.roles.set(data); this.filtered.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.roles().filter((r) => `${r.nombre} ${r.descripcion}`.toLowerCase().includes(q)));
  }

  openModal(): void {
    this.editing.set(null);
    this.roleForm.reset();
    this.selectedPermissionIds.set([]);
    // Reset filters so all permissions are visible by default
    this.permissionFilter = '';
    this.moduleFilter = 'all';
    // Expand groups so user sees permissions immediately when creating a new role
    this.permissionGroups = this.permissionGroups.map(g => ({ ...g, expanded: true }));
    this.showModal.set(true);
  }

  editRole(role: Role): void {
    this.editing.set(role);
    this.roleForm.patchValue({ nombre: role.nombre, descripcion: role.descripcion || '' });
    this.selectedPermissionIds.set([]);
    // Reset filters so all permissions are visible by default
    this.permissionFilter = '';
    this.moduleFilter = 'all';

    const loadAndAssign = () => {
      this.permissionsService.getPermissionsByRole(role.id_rol).subscribe({
        next: (permissions) => {
          const ids = (permissions || []).map((perm) => perm.id_permiso!).filter(id => typeof id === 'number' && !isNaN(id));
          this.selectedPermissionIds.set(ids);
          // Expand all groups so user sees permissions immediately
          this.permissionGroups = this.permissionGroups.map(g => ({ ...g, expanded: true }));
          this.showModal.set(true);
        },
        error: () => {
          this.selectedPermissionIds.set([]);
          this.permissionGroups = this.permissionGroups.map(g => ({ ...g, expanded: true }));
          this.showModal.set(true);
        },
      });
    };

    // If permissions list not loaded yet, fetch it first then assign
    if (!this.allPermissions() || this.allPermissions().length === 0) {
      this.permissionsService.getAll().subscribe({ next: (p) => { this.allPermissions.set(p); loadAndAssign(); }, error: () => loadAndAssign() });
    } else {
      loadAndAssign();
    }
  }

  closeModals(): void { this.showModal.set(false); }

  /**
   * Guarda un rol nuevo o actualizado junto con su matriz de permisos
   */
  save(): void {
    if (this.roleForm.invalid) { this.roleForm.markAllAsTouched(); return; }
    this.saving.set(true);

    // Build a clean payload with only valid fields for the backend
    const formVal = this.roleForm.value;
    const data: Partial<Role> = {
      nombre: formVal.nombre || ''
    };

    const editing = this.editing();
    const roleRequest = editing
      ? this.rolesService.update(editing.id_rol, data)
      : this.rolesService.create(data);

    roleRequest.subscribe({
      next: (savedRole) => {
        const roleId = savedRole.id_rol ?? (editing ? editing.id_rol : 0);
        // Compile clean array of numeric permission IDs
        const permissionIds: number[] = (this.selectedPermissionIds() || [])
          .filter((id): id is number => typeof id === 'number' && !isNaN(id) && id > 0);

        this.rolesService.updateRolePermissions(roleId, permissionIds).subscribe({
          next: () => {
            this.toast.success('Rol guardado con permisos actualizados exitosamente');
            this.closeModals();
            this.loadRoles();
            this.saving.set(false);
          },
          error: (error) => {
            console.error('Error actualizando permisos:', error);
            this.toast.error('Rol guardado, pero no se pudieron actualizar los permisos');
            this.closeModals();
            this.loadRoles();
            this.saving.set(false);
          },
        });
      },
      error: (error) => {
        console.error('Error guardando rol:', error);
        this.toast.error('Error al guardar el rol. Por favor, intenta de nuevo');
        this.saving.set(false);
      },
    });
  }

  async deleteRole(id: number) {
    const role = this.roles().find(r => r.id_rol === id);
    const roleName = role ? role.nombre : '';

    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar el rol '${roleName}'? Esta acción no se puede deshacer.`
    });

    if (!confirmed) return;

    this.rolesService.delete(id).subscribe({
      next: () => { this.toast.success('Rol eliminado'); this.loadRoles(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  togglePermission(permissionId: number, checked: boolean): void {
    this.selectedPermissionIds.update((ids) => {
      if (checked) return ids.includes(permissionId) ? ids : [...ids, permissionId];
      return ids.filter((id) => id !== permissionId);
    });
  }

}
