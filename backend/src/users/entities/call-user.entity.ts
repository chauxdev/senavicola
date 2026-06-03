import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('llamar_usuario')
export class CallUser {
  @PrimaryGeneratedColumn()
  id_llamar_usuario!: number;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_creacion!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_modificacion!: Date;

  @ManyToOne(() => User, (usuario) => usuario.llamarUsuarios)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: User;

  @OneToMany(() => Supply, (supply) => supply.llamarUsuario)
  insumos!: Supply[];
}
