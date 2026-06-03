import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RolesService, PermissionsService } from '../../../core/services/api.services';
import { ToastService } from '../../../core/services/toast.service';
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
              <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
              <tbody>
                @for (role of filtered(); track role.id_rol) {
                  <tr>
                    <td>#{{ role.id_rol }}</td>
                    <td><strong>{{ role.nombre }}</strong></td>
                    <td>{{ role.descripcion || '—' }}</td>
                    <td class="actions-cell">
                      <button class="btn-icon edit" (click)="editRole(role)"><i class="fas fa-edit"></i></button>
                      <button class="btn-icon view" title="Ver permisos" (click)="openPermModal(role)"><i class="fas fa-key"></i></button>
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
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            <button class="btn-green" (click)="save()"><i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Crear' }}</button>
          </div>
        </div>
      </div>
    }

    @if (showPermModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-key"></i> Permisos del Rol: {{ selectedRole()?.nombre }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Permisos Asignados</label>
              <div class="role-chips">
                @for (perm of rolePermissions(); track perm.id) {
                  <span class="badge active">
                    {{ perm.nombre }}
                    <button class="chip-remove" (click)="removePermission(perm.id)"><i class="fas fa-times"></i></button>
                  </span>
                }
                @if (!rolePermissions().length) { <span class="badge inactive">Sin permisos</span> }
              </div>
            </div>
            <div class="form-group" style="margin-top:2rem">
              <label>Agregar Permiso</label>
              <select [(ngModel)]="selectedPermId">
                <option value="">Seleccionar permiso</option>
                @for (perm of allPermissions(); track perm.id) {
                  <option [value]="perm.id">{{ perm.nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cerrar</button>
            <button class="btn-green" (click)="assignPermission()" [disabled]="!selectedPermId">
              <i class="fas fa-plus"></i> Asignar
            </button>
          </div>
        </div>
      </div>
    }
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
  `],
})
export class RolesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private permissionsService = inject(PermissionsService);
  private toast = inject(ToastService);

  loading = signal(true);
  roles = signal<Role[]>([]);
  filtered = signal<Role[]>([]);
  allPermissions = signal<Permission[]>([]);
  rolePermissions = signal<Permission[]>([]);
  searchQuery = '';
  showModal = signal(false);
  showPermModal = signal(false);
  editing = signal<Role | null>(null);
  selectedRole = signal<Role | null>(null);
  selectedPermId = '';
  saving = signal(false);

  roleForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit(): void {
    this.loadRoles();
    this.permissionsService.getAll().subscribe((p) => this.allPermissions.set(p));
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

  openModal(): void { this.editing.set(null); this.roleForm.reset(); this.showModal.set(true); }

  editRole(role: Role): void {
    this.editing.set(role);
    this.roleForm.patchValue(role);
    this.showModal.set(true);
  }

  openPermModal(role: Role): void {
    this.selectedRole.set(role);
    this.selectedPermId = '';
    this.permissionsService.getPermissionsByRole(role.id_rol).subscribe((p) => this.rolePermissions.set(p));
    this.showPermModal.set(true);
  }

  closeModals(): void { this.showModal.set(false); this.showPermModal.set(false); }

  save(): void {
    if (this.roleForm.invalid) { this.roleForm.markAllAsTouched(); return; }
    const data = this.roleForm.value as Partial<Role>;
    const editing = this.editing();
    const req = editing ? this.rolesService.update(editing.id_rol, data) : this.rolesService.create(data);
    req.subscribe({
      next: () => { this.toast.success('Rol guardado'); this.closeModals(); this.loadRoles(); },
      error: () => this.toast.error('Error al guardar el rol'),
    });
  }

  deleteRole(id: number): void {
    if (!confirm('¿Eliminar este rol?')) return;
    this.rolesService.delete(id).subscribe({
      next: () => { this.toast.success('Rol eliminado'); this.loadRoles(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  assignPermission(): void {
    const role = this.selectedRole();
    if (!role || !this.selectedPermId) return;
    this.permissionsService.assignPermission({ id_rol: role.id_rol, id_permiso: +this.selectedPermId }).subscribe({
      next: () => { this.toast.success('Permiso asignado'); this.openPermModal(role); },
      error: () => this.toast.error('Error al asignar permiso'),
    });
  }

  removePermission(permId: number): void {
    const role = this.selectedRole();
    if (!role) return;
    this.permissionsService.removePermission({ id_rol: role.id_rol, id_permiso: permId }).subscribe({
      next: () => { this.toast.success('Permiso removido'); this.rolePermissions.update((p) => p.filter((x) => x.id !== permId)); },
      error: () => this.toast.error('Error al remover permiso'),
    });
  }
}
