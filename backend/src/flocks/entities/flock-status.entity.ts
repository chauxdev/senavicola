import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Flock } from './flock.entity';

@Entity('estado_lote')
export class FlockStatus {
  @PrimaryGeneratedColumn('uuid')
  id_estado_lote!: string;

  @Column()
  estado!: string;

  @ManyToOne(() => Flock, (flock) => flock.ubicacion)
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock;
}
