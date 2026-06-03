import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Flock } from './flock.entity';

@Entity('finalizacion_lote')
export class FinishedFlock {
  @PrimaryGeneratedColumn('uuid')
  id_finalizacion_lote!: string;

  @Column()
  cantidad!: number;

  @Column()
  razon!: string;

  @CreateDateColumn()
  fecha!: Date;

  @ManyToOne(() => Flock, (flock) => flock.ubicacion)
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock;
}
