import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('unidad_medida')
export class MeasurementUnit {
  @PrimaryGeneratedColumn('uuid')
  id_unidad_medida!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255 })
  abreviatura!: string;

  @OneToMany(() => Supply, (insumo) => insumo.unidadMedida)
  insumos!: Supply[];
}
