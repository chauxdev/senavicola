import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { EggInventory } from './egg-inventory.entity';
import { EggProduction } from './egg-production.entity';

@Entity('historial_huevo')
export class EggHistory {
  @PrimaryGeneratedColumn('uuid')
  id_historial_huevo!: string;

  @ManyToOne(() => EggInventory, (inventory) => inventory.history, { nullable: true })
  inventario?: EggInventory;

  @ManyToOne(() => EggProduction, { nullable: true })
  produccion?: EggProduction;

  @Column({ nullable: true })
  usuarioId?: string;

  @Column()
  cantidad!: number;

  /** 'Nuevo Registro' | 'Actualización' | 'Huevos Dañados' */
  @Column({ name: 'tipo_movimiento', nullable: true, default: 'Nuevo Registro' })
  tipoMovimiento?: string;

  @Column({ name: 'cantidad_anterior', nullable: true })
  cantidadAnterior?: number;

  @CreateDateColumn()
  fecha!: Date;
}

