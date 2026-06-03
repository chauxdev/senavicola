import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Flock } from '../../flocks/entities/flock.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('alimentacion')
export class Feeding {
  @PrimaryGeneratedColumn('uuid', { name: 'id_alimentacion' })
  id_alimentacion!: string;

  @ManyToOne(() => User)
  usuario!: User;

  @ManyToOne(() => Flock)
  lote!: Flock;

  @ManyToOne(() => Supply)
  insumo!: Supply;

  @Column('decimal', { name: 'cantidad' })
  cantidad!: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;
}
