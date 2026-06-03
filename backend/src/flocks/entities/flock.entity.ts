import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Breed } from '../../breeds/entities/breed.entity';
import { FlockLocation } from './flock-location.entity';
import { FlockStatus } from './flock-status.entity';
import { EggProduction } from '../../egg-inventory/entities/egg-production.entity';
import { EggInventory } from '../../egg-inventory/entities/egg-inventory.entity';

@Entity('lote')
export class Flock {
  @PrimaryGeneratedColumn('uuid')
  id_lote!: string;

  @Column()
  nombre!: string;

  @Column()
  total_aves!: number;

  @Column()
  observacion!: string;

  @Column()
  racion_alimento!: string;

  @Column()
  estado!: string;

  @ManyToOne(() => Breed)
  @JoinColumn({ name: 'id_raza' })
  raza!: Breed;

  @DeleteDateColumn({ name: 'fecha_eliminacion', type: 'timestamp', nullable: true })
  fecha_eliminacion?: Date;

  @OneToMany(() => FlockLocation, (location) => location.lote)
  ubicacion!: FlockLocation[];

  @OneToMany(() => FlockStatus, (status) => status.lote)
  estados!: FlockStatus[];

  @OneToMany(() => EggProduction, (production) => production.lote)
  produccion_huevo!: EggProduction[];

  @OneToMany(() => EggInventory, (inventory) => inventory.lote)
  inventario_huevo!: EggInventory[];
}
