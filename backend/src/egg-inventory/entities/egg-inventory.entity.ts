import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Flock } from '../../flocks/entities/flock.entity';
import { EggProduction } from './egg-production.entity';
import { DamagedEgg } from './damaged-egg.entity';
import { EggHistory } from './egg-history.entity';
import { EggType } from '../../egg-types/entities/egg-type.entity';

@Entity('inventario_huevo')
export class EggInventory {
  @PrimaryGeneratedColumn('uuid')
  id_inventario_huevo!: string;

  @ManyToOne(() => EggType)
  @JoinColumn({ name: 'tipo_huevo_id' })
  tipo_huevo!: EggType;

  @ManyToOne(() => Flock, (flock) => flock.inventario_huevo)
  lote!: Flock;

  @ManyToOne(() => EggProduction, (production) => production.inventories)
  produccion!: EggProduction;

  @Column()
  cantidad!: number;

  @DeleteDateColumn({ name: 'fecha_eliminacion', type: 'timestamp', nullable: true })
  fecha_eliminacion?: Date;

  @OneToMany(() => DamagedEgg, damaged => damaged.inventario)
  damagedEggs!: DamagedEgg[];

  @OneToMany(() => EggHistory, (history) => history.inventario)
  history!: EggHistory[];
}
