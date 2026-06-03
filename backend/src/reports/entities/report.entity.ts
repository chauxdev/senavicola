import { User } from '../../users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('reporte')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id_reporte!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: User;

  @Column()
  tipo_reporte!: string;
}
