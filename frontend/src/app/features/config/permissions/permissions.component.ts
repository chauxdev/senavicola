import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { PermissionsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Permisos del Sistema"
      subtitle="Gestiona los permisos disponibles para asignar a roles."
      entityName="Permiso"
      icon="fa-key"
      [fields]="fields"
    />
  `,
})
export class PermissionsComponent {
  service = inject(PermissionsService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: ver_usuarios', required: true },
    { key: 'recurso', label: 'Recurso', type: 'text', placeholder: 'Ej: users', required: false },
    { key: 'accion', label: 'Acción', type: 'text', placeholder: 'Ej: read', required: false },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción...', required: false },
  ];
}
