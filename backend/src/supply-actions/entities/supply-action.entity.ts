import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SupplyHistory } from '../../supply-history/entities/supply-history.entity';

@Entity('accion_historial_movimiento')
export class SupplyAction {
  @PrimaryGeneratedColumn('uuid')
  id_accion_historial_movimiento!: string;

  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @OneToMany(() => SupplyHistory, (hist) => hist.accion)
  historial!: SupplyHistory[];
}
