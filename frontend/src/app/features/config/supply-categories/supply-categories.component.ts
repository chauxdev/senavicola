import { Component, inject } from '@angular/core';
import { SimpleCrudComponent, CrudField } from '../../../shared/components/simple-crud/simple-crud.component';
import { SupplyCategoriesService } from '../../../core/services/api.services';

@Component({
  selector: 'app-supply-categories',
  standalone: true,
  imports: [SimpleCrudComponent],
  template: `
    <app-simple-crud
      [service]="service"
      title="Categorías de Insumos"
      subtitle="Clasifica los insumos de la granja."
      entityName="Categoría"
      icon="fa-tags"
      idField="id_categoria_insumo"
      [fields]="fields"
    />
  `,
})
export class SupplyCategoriesComponent {
  service = inject(SupplyCategoriesService);
  fields: CrudField[] = [
    { key: 'nombre_categoria', label: 'Nombre', type: 'text', placeholder: 'Ej: Alimentos', required: true },
  ];
}
