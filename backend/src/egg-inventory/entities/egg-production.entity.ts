import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Flock } from '../../flocks/entities/flock.entity';
import { EggInventory } from './egg-inventory.entity';
import { EggType } from '../../egg-types/entities/egg-type.entity';

@Entity('produccion_huevo')
export class EggProduction {
  @PrimaryGeneratedColumn('uuid')
  id_produccion_huevo!: string;

  @ManyToOne(() => Flock, (flock) => flock.produccion_huevo)
  lote: Flock = new Flock();

  @Column()
  tipo_huevoId!: string;

  @ManyToOne(() => EggType)
  @JoinColumn({ name: 'tipo_huevoId' })
  tipo_huevo!: EggType;

  @Column()
  cantidady!: number;

  @CreateDateColumn()
  produccionFecha!: Date;

  @OneToMany(() => EggInventory, (inventory) => inventory.produccion)
  inventories!: EggInventory[];
}
