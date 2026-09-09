import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SupplyCategory } from '../../supply-categories/entities/supply-category.entity';
import { MeasurementUnit } from '../../measurement-units/entities/measurement-unit.entity';
import { CallUser } from '../../users/entities/call-user.entity';
import { SupplyHistory } from '../../supply-history/entities/supply-history.entity';
import { Feeding } from '../../feeding/entities/feeding.entity';

@Entity('insumo')
export class Supply {
  @PrimaryGeneratedColumn('uuid')
  id_insumo!: string;

  @ManyToOne(() => SupplyCategory, (cat) => cat.insumos)
  @JoinColumn({ name: 'id_categoria' })
  categoria!: SupplyCategory;

  @Column()
  id_categoria!: string;

  @ManyToOne(() => MeasurementUnit, (unit) => unit.insumos)
  @JoinColumn({ name: 'id_unidad_medida' })
  unidadMedida!: MeasurementUnit;

  @Column()
  id_unidad_medida!: string;

  @ManyToOne(() => CallUser, (lu) => lu.insumos)
  @JoinColumn({ name: 'id_llamar_usuario' })
  llamarUsuario!: CallUser;

  @Column()
  id_llamar_usuario!: number;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'integer' })
  cantidad!: number;

  @Column({ name: 'stock_minimo', type: 'integer', default: 0 })
  stockMinimo!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  proveedor?: string;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2, default: 0 })
  precioUnitario!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @DeleteDateColumn({ name: 'fecha_eliminacion', type: 'timestamp', nullable: true })
  fecha_eliminacion?: Date;

  @OneToMany(() => SupplyHistory, (hist) => hist.insumo)
  historial!: SupplyHistory[];

  @OneToMany(() => Feeding, (ali) => ali.insumo)
  alimentaciones!: Feeding[];
}
