import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
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
  id_categoria!: number;

  @ManyToOne(() => MeasurementUnit, (unit) => unit.insumos)
  @JoinColumn({ name: 'id_unidad_medida' })
  unidadMedida!: MeasurementUnit;

  @Column()
  id_unidad_medida!: number;

  @ManyToOne(() => CallUser, (lu) => lu.insumos)
  @JoinColumn({ name: 'id_llamar_usuario' })
  llamarUsuario!: CallUser;

  @Column()
  id_llamar_usuario!: number;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cantidad!: number;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @OneToMany(() => SupplyHistory, (hist) => hist.insumo)
  historial!: SupplyHistory[];

  @OneToMany(() => Feeding, (ali) => ali.insumo)
  alimentaciones!: Feeding[];
}
