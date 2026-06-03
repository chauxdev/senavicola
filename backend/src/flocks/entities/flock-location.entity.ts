import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Flock } from './flock.entity';
import { Barn } from '../../barns/entities/barn.entity';

@Entity('ubicacion_lote')
export class FlockLocation {
  @PrimaryGeneratedColumn('uuid')
  id_ubicacion_lote!: string;

  @ManyToOne(() => Flock, (flock) => flock.ubicacion)
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock;

  @ManyToOne(() => Barn, (barn) => barn.ubicacion_lote)
  @JoinColumn({ name: 'id_galpon' })
  galpon!: Barn;

  @CreateDateColumn()
  Fecha!: Date;
}
