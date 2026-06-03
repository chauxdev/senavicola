import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { BarnsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-barns-config',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Galpones"
      subtitle="Gestiona los galpones de la granja."
      entityName="Galpón"
      icon="fa-warehouse"
      idField="id_galpon"
      [fields]="fields"
    />
  `,
})
export class BarnsConfigComponent {
  service = inject(BarnsService);
  fields: CrudField[] = [
    { key: 'codigo', label: 'Código', type: 'text', placeholder: 'Ej: G-001', required: true },
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Galpón 1', required: true },
    { key: 'capacidadMaxAves', label: 'Capacidad Máx. Aves', type: 'number', placeholder: 'Ej: 500', required: true },
    { key: 'longitud', label: 'Longitud (m)', type: 'number', placeholder: 'Ej: 20', required: true },
  ];
}
