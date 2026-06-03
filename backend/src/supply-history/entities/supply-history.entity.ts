import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supply } from '../../supplies/entities/supply.entity';
import { SupplyAction } from '../../supply-actions/entities/supply-action.entity';

@Entity('historial_insumo')
export class SupplyHistory {
  @PrimaryGeneratedColumn('uuid')
  id_historial_insumo!: string;

  @Column()
  id_insumos!: string;

  @Column()
  id_historial_accion!: number;

  @Column({ type: 'float' })
  cantidad!: number;

  @Column({ type: 'varchar', length: 255 })
  descripcion!: string;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @ManyToOne(() => Supply, (insumo) => insumo.historial)
  @JoinColumn({ name: 'id_insumos' })
  insumo!: Supply;

  @ManyToOne(() => SupplyAction, (action) => action.historial)
  @JoinColumn({ name: 'id_historial_accion' })
  accion!: SupplyAction;
}
