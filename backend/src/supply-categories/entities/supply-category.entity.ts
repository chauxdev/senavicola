import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('categoria_insumo')
export class SupplyCategory {
  @PrimaryGeneratedColumn('uuid')
  id_categoria_insumo!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre_categoria!: string;

  @OneToMany(() => Supply, (insumo) => insumo.categoria)
  insumos!: Supply[];
}
