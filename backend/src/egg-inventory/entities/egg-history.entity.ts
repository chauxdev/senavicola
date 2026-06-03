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

  @ManyToOne(() => EggInventory, (inventory) => inventory.history)
  inventario!: EggInventory;

  @ManyToOne(() => EggProduction)
  produccion!: EggProduction;

  @Column()
  usuarioId!: string;

  @Column()
  cantidad!: number;

  @CreateDateColumn()
  fecha!: Date;
}
