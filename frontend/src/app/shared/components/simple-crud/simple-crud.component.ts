import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseApiService } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PermissionsService } from '../../../core/services/permissions.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PaginationComponent } from '../pagination/pagination.component';

export interface CrudField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

@Component({
  selector: 'app-simple-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, PaginationComponent],
  template: `
    <div class="crud-page">
      <div class="module-header">
        <div class="module-header-left">
          <div class="module-icon"><i class="fas {{ icon }}"></i></div>
          <div><h2>{{ title }}</h2><p>{{ subtitle }}</p></div>
        </div>
        <div class="module-header-right">
          <a routerLink="/config" class="btn-outline"><i class="fas fa-arrow-left"></i> Volver</a>
          @if (permissions.canWrite()) {
            <button class="btn-green" (click)="openModal()"><i class="fas fa-plus"></i> Nuevo</button>
          }
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
          <h3>{{ title }}</h3>
          <div class="search-bar">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Buscar..." [(ngModel)]="searchQuery" (input)="filterItems()" />
          </div>
        </div>
        @if (loading()) { <div class="loading-container"><div class="spinner"></div></div> }
        @else if (filtered().length === 0) {
          <div class="empty-state">
            <i class="fas {{ icon }}"></i>
            <h3>No hay registros</h3>
            <p>Crea el primero haciendo clic en "Nuevo"</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 60px;">#</th>
                  @for (field of fields; track field.key) { <th>{{ field.label }}</th> }
                  @if (permissions.canWrite()) {
                    <th style="text-align: right; width: 120px;">Acciones</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (item of pagedItems; track $index) {
                  <tr>
                    <td><strong>{{ (currentPage - 1) * limit + $index + 1 }}</strong></td>
                    @for (field of fields; track field.key) {
                      <td>{{ asRecord(item)[field.key] || '—' }}</td>
                    }
                    @if (permissions.canWrite()) {
                      <td class="actions-cell" style="text-align: right; justify-content: flex-end;">
                        <button class="btn-icon edit" (click)="editItem(item)"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete" (click)="deleteItem(getItemId(item))"><i class="fas fa-trash"></i></button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination 
            [currentPage]="currentPage" 
            [totalPages]="totalPages" 
            [totalItems]="filtered().length"
            (pageChange)="onPageChange($event)">
          </app-pagination>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fas {{ icon }}"></i> {{ editing() ? 'Editar' : 'Nuevo' }} {{ entityName }}</h3>
            <button class="btn-close" (click)="closeModal()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="form">
              @for (field of fields; track field.key) {
                <div class="form-group">
                  <label>
                    <i class="fas {{ icon }}"></i> {{ field.label }}
                    @if (field.required) {
                      <span style="color: red">*</span>
                    }
                  </label>
                  @if (field.type === 'textarea') {
                    <textarea [formControlName]="field.key" [placeholder]="field.placeholder || ''" rows="3" [readonly]="permissions.isVisitor() || (editing() !== null && disabledOnEditFields.includes(field.key))" [class.input-disabled]="permissions.isVisitor() || (editing() !== null && disabledOnEditFields.includes(field.key))"></textarea>
                  } @else {
                    <input [type]="field.type" [formControlName]="field.key" [placeholder]="field.placeholder || ''" [readonly]="permissions.isVisitor() || (editing() !== null && disabledOnEditFields.includes(field.key))" [class.input-disabled]="permissions.isVisitor() || (editing() !== null && disabledOnEditFields.includes(field.key))" />
                  }
                </div>
              }
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Cancelar</button>
            @if (permissions.canWrite()) {
              <button class="btn-green" (click)="save()" [disabled]="saving()">
                <i class="fas fa-save"></i> {{ editing() ? 'Actualizar' : 'Crear' }}
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
    .btn-close { background: none; border: none; font-size: 2rem; color: var(--gray-dark); cursor: pointer; }
  `],
})
export class SimpleCrudComponent<T> implements OnInit {
  @Input({ required: true }) service!: BaseApiService<T>;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() entityName = 'Registro';
  @Input() icon = 'fa-list';
  @Input({ required: true }) fields!: CrudField[];
  /** Name of the primary key field in the backend entity (e.g. 'id_tipo', 'id_galpon') */
  @Input() idField = 'id';
  @Input() disabledOnEditFields: string[] = [];

  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmService);
  public permissions = inject(PermissionsService);

  loading = signal(true);
  items = signal<T[]>([]);
  filtered = signal<T[]>([]);
  searchQuery = '';
  showModal = signal(false);
  editing = signal<T | null>(null);
  saving = signal(false);
  form!: FormGroup;

  currentPage = 1;
  limit = 5;

  get pagedItems(): T[] {
    const start = (this.currentPage - 1) * this.limit;
    return this.filtered().slice(start, start + this.limit);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered().length / this.limit);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  asRecord(item: T): Record<string, unknown> { return item as Record<string, unknown>; }

  /** Gets the primary key value from an item, trying the configured idField */
  getItemId(item: T): string | number {
    const rec = item as Record<string, unknown>;
    // Try the configured idField first
    if (rec[this.idField] != null) return rec[this.idField] as string | number;
    // Fallback: search for any key starting with 'id_'
    const idKey = Object.keys(rec).find(k => k.startsWith('id_') || k === 'id');
    return idKey ? rec[idKey] as string | number : 0;
  }

  /** Gets a short display version of the ID */
  getItemIdShort(item: T): string {
    const id = this.getItemId(item);
    if (typeof id === 'string' && id.length > 8) return id.substring(0, 8) + '…';
    return String(id);
  }

  ngOnInit(): void {
    this.buildForm();
    this.load();
  }

  private buildForm(): void {
    const controls: Record<string, unknown> = {};
    for (const field of this.fields) {
      controls[field.key] = [null, field.required !== false ? Validators.required : []];
    }
    this.form = this.fb.group(controls);
  }

  private load(): void {
    this.service.getAll().subscribe({
      next: (data) => { 
        this.items.set(data); 
        this.filtered.set(data); 
        this.loading.set(false); 
        this.currentPage = 1;
      },
      error: () => this.loading.set(false),
    });
  }

  filterItems(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered.set(this.items().filter((item) =>
      this.fields.some((f) => String((item as Record<string, unknown>)[f.key] ?? '').toLowerCase().includes(q))
    ));
    this.currentPage = 1;
  }

  openModal(): void { this.editing.set(null); this.form.reset(); this.showModal.set(true); }

  editItem(item: T): void {
    this.editing.set(item);
    const patch: Record<string, unknown> = {};
    for (const field of this.fields) patch[field.key] = (item as Record<string, unknown>)[field.key];
    this.form.patchValue(patch);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    // Clean the form data: remove null/undefined/empty-string values
    const rawData = this.form.value as Record<string, unknown>;
    const cleanData: Record<string, unknown> = {};
    for (const key of Object.keys(rawData)) {
      if (rawData[key] !== null && rawData[key] !== undefined && rawData[key] !== '') {
        cleanData[key] = rawData[key];
      }
    }

    const editing = this.editing();
    const editingId = editing ? this.getItemId(editing) : null;
    const req = editingId ? this.service.update(editingId, cleanData as Partial<T>) : this.service.create(cleanData as Partial<T>);

    req.subscribe({
      next: () => { this.toast.success(`${this.entityName} guardado`); this.closeModal(); this.load(); },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(msg ? `Error: ${Array.isArray(msg) ? msg.join(', ') : msg}` : 'Error al guardar');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  async deleteItem(id: string | number) {
    let itemDetail = '';
    const itemObj = this.items().find(it => this.getItemId(it) === id);
    if (itemObj) {
      const rec = itemObj as Record<string, any>;
      itemDetail = rec['nombre'] || rec['nombre_categoria'] || rec['nombre_rol'] || rec['nombre_permiso'] || rec['tipo'] || rec['abreviatura'] || '';
    }

    const msg = itemDetail 
      ? `¿Estás seguro de que deseas eliminar ${this.entityName.toLowerCase()} '${itemDetail}'? Esta acción no se puede deshacer.`
      : `¿Estás seguro de que deseas eliminar este ${this.entityName.toLowerCase()}? Esta acción no se puede deshacer.`;

    const confirmed = await this.confirmService.confirm({
      title: 'Confirmar eliminación',
      message: msg
    });

    if (!confirmed) return;

    this.service.delete(id).subscribe({
      next: () => { this.toast.success(`${this.entityName} eliminado`); this.load(); },
      error: () => this.toast.error('Error al eliminar'),
    });
  }
}

