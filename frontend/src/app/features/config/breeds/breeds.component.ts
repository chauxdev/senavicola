import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { BreedsService } from '../../../core/services/api.services';

@Component({
  selector: 'app-breeds',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Razas de Gallinas"
      subtitle="Gestiona las razas disponibles en el sistema."
      entityName="Raza"
      icon="fa-dna"
      idField="id_raza"
      [fields]="fields"
    />
  `,
})
export class BreedsComponent {
  service = inject(BreedsService);
  fields: CrudField[] = [
    { key: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Ej: Leghorn', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción...', required: true },
  ];
}
