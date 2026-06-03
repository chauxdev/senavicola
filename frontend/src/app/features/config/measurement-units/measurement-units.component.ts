import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { MeasurementUnitsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-measurement-units',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Unidades de Medida"
      subtitle="Gestiona las unidades de medida para insumos."
      entityName="Unidad"
      icon="fa-ruler"
      idField="id_unidad_medida"
      [fields]="fields"
    />
  `,
})
export class MeasurementUnitsComponent {
  service = inject(MeasurementUnitsService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Kilogramo', required: true },
    { key: 'abreviatura', label: 'Abreviatura', type: 'text', placeholder: 'Ej: kg', required: true },
  ];
}
