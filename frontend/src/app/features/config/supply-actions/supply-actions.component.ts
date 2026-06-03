import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { SupplyActionsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-supply-actions',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Acciones de Insumos"
      subtitle="Tipos de acciones que se pueden realizar sobre insumos."
      entityName="Acción"
      icon="fa-tasks"
      idField="id_accion_historial_movimiento"
      [fields]="fields"
    />
  `,
})
export class SupplyActionsComponent {
  service = inject(SupplyActionsService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Entrada', required: true },
  ];
}
