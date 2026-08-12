import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UsersService, RolesService } from '../../../core/services/api.services';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { User, Role } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, PaginationComponent, HasPermissionDirective],
  template: `
    <div class="users-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas fa-users"></i></div>
          <div>
            <h2>Gestión de Usuarios</h2>
            <p>Administra usuarios del sistema y sus roles.</p>
          </div>
        </div>
        <div class="module-header-right">
          <a routerLink="/config" class="btn-outline"><i class="fas fa-arrow-left"></i> Volver</a>
          <button class="btn-green" *appHasPermission="'USUARIOS_CREAR'" (click)="openModal()">
            <i class="fas fa-plus"></i> Nuevo Usuario
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>Listado de Usuarios</h3>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar usuario..." [(ngModel)]="searchQuery" (input)="onSearchInput()" />
          </div>
        </div>

        @if (loading()) {
          <div class="loading-container"><div class="spinner"></div></div>
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>No hay usuarios registrados</h3>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr><th style="width: 60px;">#</th><th>Nombre</th><th>Documento</th><th>Email</th><th>Roles</th><th>Estado</th><th style="text-align: right; width: 180px;">Acciones</th></tr>
              </thead>
              <tbody>
                @for (user of filtered(); track user.id_usuario; let idx = $index) {
                  <tr>
                    <td><strong>{{ (currentPage - 1) * limit + idx + 1 }}</strong></td>
                    <td><strong>{{ user.nombre }}</strong></td>
                    <td>{{ user.documento || user.numero_documento || '—' }}</td>
                    <td>{{ user.email || '—' }}</td>
                    <td>
                      <div class="role-chips">
                        @for (role of (user.roles || []); track role.id_rol) {
                          <span class="badge active" style="margin-right:0.4rem">{{ role.nombre }}</span>
                        }
                      </div>
                      @if (!(user.roles?.length)) { <span class="badge inactive">Sin rol</span> }
                    </td>
                    <td>
                      <span class="badge {{ user.estado !== false ? 'active' : 'inactive' }}">
                        {{ user.estado !== false ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn-icon view" title="Ver Detalle" (click)="viewUser(user)"><i class="fas fa-eye"></i></button>
                          <button class="btn-icon edit" *appHasPermission="'USUARIOS_EDITAR'" title="Editar" (click)="editUser(user)"><i class="fas fa-edit"></i></button>
                          <button class="btn-icon assign" *appHasPermission="'ROLES_EDITAR'" title="Asignar Rol" (click)="openRoleModal(user)"><i class="fas fa-user-tag"></i></button>
                          <button class="btn-icon delete" *appHasPermission="'USUARIOS_ELIMINAR'" title="Inactivar" (click)="deleteUser(user.id_usuario)"><i class="fas fa-ban"></i></button>
                      </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination 
            [currentPage]="currentPage" 
            [totalPages]="totalPages" 
            [totalItems]="totalItems"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </div>
    </div>

    <!-- Modal Usuario -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user"></i> {{ editing() ? 'Editar Usuario' : 'Nuevo Usuario' }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="userForm">
              <div class="form-group">
                <label><i class="fas fa-user"></i> Nombre</label>
                <input type="text" formControlName="nombre" placeholder="Nombre" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
              <div class="form-group">
                <label><i class="fas fa-user"></i> Apellido</label>
                <input type="text" formControlName="apellido" placeholder="Apellido" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label><i class="fas fa-id-card"></i> Documento</label>
                  <input type="text" formControlName="documento" placeholder="Número de documento" [readonly]="permissions.isVisitor() || editing() !== null" [class.input-disabled]="permissions.isVisitor() || editing() !== null" />
                </div>
                <div class="form-group">
                  <label><i class="fas fa-envelope"></i> Email</label>
                  <input type="email" formControlName="email" placeholder="correo@ejemplo.com" [readonly]="permissions.isVisitor() || editing() !== null" [class.input-disabled]="permissions.isVisitor() || editing() !== null" />
                </div>
              </div>
              @if (!editing()) {
                <div class="form-row">
                  <div class="form-group">
                    <label><i class="fas fa-lock"></i> Contraseña</label>
                    <input type="password" formControlName="password" placeholder="Contraseña" [readonly]="permissions.isVisitor()" [class.input-disabled]="permissions.isVisitor()" />
                  </div>
                  <div class="form-group">
                    <label><i class="fas fa-user-tag"></i> Rol Inicial</label>
                    <select formControlName="rolId" [attr.disabled]="permissions.isVisitor() ? true : null">
                      <option value="">Seleccionar rol</option>
                      @for (role of roles(); track role.id_rol) {
                        <option [value]="role.id_rol">{{ role.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>
              }
              @if (editing()) {
                <div class="form-group switch-group">
                  <label><i class="fas fa-toggle-on"></i> Estado</label>
                  <div class="switch-field">
                    <input type="checkbox" id="activoSwitch" formControlName="activo" [attr.disabled]="permissions.isVisitor() ? true : null" />
                    <label for="activoSwitch">{{ userForm.controls.activo.value ? 'Activo' : 'Inactivo' }}</label>
                  </div>
                </div>
              }
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="save()" [disabled]="saving()">
                @if (saving()) { <span class="spinner_sm"></span> }
                @else { <i class="fas fa-save"></i> }
                {{ editing() ? 'Actualizar' : 'Crear Usuario' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Modal Detalle Usuario -->
    @if (showViewModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-address-card"></i> Detalle de Usuario</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            @if (viewingUser()) {
              <div class="profile-info" style="font-size: 1.4rem; line-height: 1.8;">

                <p><strong>Nombre:</strong> {{ viewingUser()?.nombre }}</p>
                <p><strong>Documento:</strong> {{ viewingUser()?.documento || viewingUser()?.numero_documento }}</p>
                <p><strong>Email:</strong> {{ viewingUser()?.email || 'No registrado' }}</p>
                <p><strong>Estado:</strong> {{ viewingUser()?.estado !== false ? 'Activo' : 'Inactivo' }}</p>
                <div style="margin-top: 1rem;">
                  <strong>Roles:</strong>
                  <div class="role-chips" style="margin-top: 0.5rem;">
                    @for (role of (viewingUser()?.roles || []); track role.id_rol) {
                      <span class="badge active">{{ role.nombre }}</span>
                    }
                    @if (!(viewingUser()?.roles?.length)) {
                      <span class="badge inactive">Sin roles asignados</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-green" (click)="closeModals()">Cerrar</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Asignar Rol -->
    @if (showRoleModal()) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas fa-user-tag"></i> Asignar Rol — {{ selectedUser()?.nombre }}</h3>
            <button class="btn-close" (click)="closeModals()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label><i class="fas fa-user-tag"></i> Roles Actuales</label>
              <div class="role-chips">
                @for (role of (selectedUser()?.roles || []); track role.id_rol) {
                  <span class="badge active">
                    {{ role.nombre }}
                    @if (permissions.canWrite()) {
                      <button class="chip-remove" (click)="removeRole(role.id_rol)"><i class="fas fa-times"></i></button>
                    }
                  </span>
                }
                @if (!(selectedUser()?.roles?.length)) {
                  <span class="badge inactive">Sin roles asignados</span>
                }
              </div>
            </div>
            <div class="form-group">
              <label><i class="fas fa-plus-circle"></i> Asignar Nuevo Rol</label>
              <select [(ngModel)]="selectedRoleId" [attr.disabled]="permissions.isVisitor() ? true : null">
                <option value="">Seleccionar rol</option>
                @for (role of roles(); track role.id_rol) {
                  <option [value]="role.id_rol">{{ role.nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModals()">Cerrar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="assignRole()" [disabled]="!selectedRoleId">
                <i class="fas fa-plus"></i> Asignar Rol
              </button>
            }
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
      tr:hover td { background: rgba(57,169,0,0.03); }
    }
    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; padding: 0.3rem; }
    .role-chips { display: flex; flex-wrap: wrap; gap: 0.8rem; }
    .chip-remove { background: none; border: none; cursor: pointer; color: inherit; margin-left: 0.4rem; font-size: 1rem; }
  `],
})
export class UsersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);
  public permissions = inject(PermissionsService);

  loading = signal(true);
  users = signal<User[]>([]);
  filtered = signal<User[]>([]);
  roles = signal<Role[]>([]);
  searchQuery = '';
  searchSubject = new Subject<string>();
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  limit = 5;

  showModal = signal(false);
  showRoleModal = signal(false);
  showViewModal = signal(false);
  editing = signal<User | null>(null);
  viewingUser = signal<User | null>(null);
  selectedUser = signal<User | null>(null);
  selectedRoleId = '';
  saving = signal(false);



  userForm = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    documento: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    rolId: [''],
    activo: [true],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.rolesService.getAll().subscribe((r) => this.roles.set(r));

    this.searchSubject.pipe(debounceTime(300)).subscribe(() => {
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.usersService.getAllPaginated({ page: this.currentPage, limit: this.limit, search: this.searchQuery }).subscribe({
      next: (res) => { 
        this.users.set(res.data); 
        this.filtered.set(res.data); 
        this.totalItems = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.loading.set(false); 
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  filter(): void {
    // Legacy local filter kept for safety if needed
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.users().filter((u) => `${u.nombre} ${u.documento} ${u.email}`.toLowerCase().includes(q)));
  }

  openModal(): void { this.editing.set(null); this.userForm.reset(); this.showModal.set(true); }

  editUser(user: User): void {
    this.editing.set(user);
    this.userForm.patchValue({
      nombre: user.nombre,
      apellido: (user as any).apellido || '',
      documento: user.numero_documento || user.documento || '',
      email: user.email || '',
      activo: user.estado !== false,
    });
    this.showModal.set(true);
  }

  viewUser(user: User): void {
    this.viewingUser.set(user);
    this.showViewModal.set(true);
  }

  openRoleModal(user: User): void { this.selectedUser.set(user); this.selectedRoleId = ''; this.showRoleModal.set(true); }

  closeModals(): void { this.showModal.set(false); this.showRoleModal.set(false); this.showViewModal.set(false); }

  save(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const formValue = { ...this.userForm.value } as any;
    // Remove empty password on edit
    if (!formValue.password) delete formValue.password;
    if (formValue.rolId) formValue.rolId = Number(formValue.rolId);
    else delete formValue.rolId;
    
    const editing = this.editing();
    const req = editing ? this.usersService.update(editing.id_usuario, formValue as Partial<User>) : this.usersService.create(formValue as Partial<User>);
    req.subscribe({
      next: () => { this.toast.success(editing ? 'Usuario actualizado' : 'Usuario creado'); this.closeModals(); this.loadUsers(); },
      error: (err) => { const msg = err?.error?.message; this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar el usuario'); this.saving.set(false); },
      complete: () => this.saving.set(false),
    });
  }

  async deleteUser(id: string) {
    const user = this.users().find(u => u.id_usuario === id);
    const userName = user ? user.nombre : '';

    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar al usuario '${userName}'? Esta acción no se puede deshacer.`
    });

    if (!confirmed) return;

    this.usersService.delete(id).subscribe({
      next: () => { this.toast.success('Usuario eliminado'); this.loadUsers(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }

  assignRole(): void {
    const user = this.selectedUser();
    if (!user || !this.selectedRoleId) return;
    this.rolesService.assignRole({ id_usuario: user.id_usuario, id_rol: +this.selectedRoleId }).subscribe({
      next: () => { this.toast.success('Rol asignado exitosamente'); this.loadUsers(); this.closeModals(); },
      error: () => this.toast.error('Error al asignar rol'),
    });
  }

  removeRole(roleId: number): void {
    const user = this.selectedUser();
    if (!user) return;
    this.rolesService.removeRole({ id_usuario: user.id_usuario, id_rol: roleId }).subscribe({
      next: () => { this.toast.success('Rol removido'); this.loadUsers();
        const updated = { ...user, roles: (user.roles || []).filter((r) => r.id_rol !== roleId) };
        this.selectedUser.set(updated as User);
      },
      error: () => this.toast.error('Error al remover rol'),
    });
  }
}
