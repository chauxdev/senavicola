import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { EggTypesService } from '../../../core/services/api.services';

@Component({
  selector: 'app-egg-types',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Tipos de Huevo"
      subtitle="Gestiona la clasificación de tipos de huevo."
      entityName="Tipo de Huevo"
      icon="fa-egg"
      idField="id_tipo"
      [fields]="fields"
    />
  `,
})
export class EggTypesComponent {
  service = inject(EggTypesService);
  fields: CrudField[] = [
    { key: 'tipo', label: 'Tipo', type: 'text', placeholder: 'Ej: JUMBO', required: true },
    { key: 'peso_min', label: 'Peso Mínimo (g)', type: 'number', placeholder: 'Ej: 60', required: true },
    { key: 'peso_max', label: 'Peso Máximo (g)', type: 'number', placeholder: 'Ej: 70', required: true },
  ];
}
