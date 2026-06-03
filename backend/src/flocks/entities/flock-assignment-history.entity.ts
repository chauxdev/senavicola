import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Flock } from './flock.entity';
import { Barn } from '../../barns/entities/barn.entity';

@Entity('historial_asignacion_lote')
export class FlockAssignmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id_historial_asignacion_lote!: string;

  @Column()
  cantidad_asignada!: number;

  @ManyToOne(() => Flock)
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock;

  @ManyToOne(() => Barn, barn => barn.asignacion_historial)
  @JoinColumn({ name: 'id_galpon' })
  galpon!: Barn;
}
