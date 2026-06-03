import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Flock } from './flock.entity';

@Entity('aves_fallecidas')
export class DeadBird {
  @PrimaryGeneratedColumn('uuid')
  id_aves_fallecidas!: string;

  @Column()
  cantidad!: number;

  @ManyToOne(() => Flock, (flock) => flock.ubicacion)
  @JoinColumn({ name: 'id_lote' })
  lote!: Flock;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
