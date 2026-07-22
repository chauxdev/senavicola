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

  @ManyToOne(() => Flock, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock | null;

  @ManyToOne(() => Barn, barn => barn.asignacion_historial, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'id_galpon' })
  galpon!: Barn | null;

  @Column({ name: 'fecha', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha!: Date;

  @Column({ name: 'descripcion', type: 'varchar', length: 255, default: '' })
  descripcion!: string;

  @Column({ name: 'usuario', type: 'varchar', length: 255, default: 'Sistema' })
  usuario!: string;

  @Column({ name: 'nombre_elemento', type: 'varchar', length: 255, default: '' })
  nombre_elemento!: string;

  @Column({ name: 'raza_nombre', type: 'varchar', length: 255, nullable: true })
  raza_nombre!: string | null;
}
