import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from '../../users/entities/user.entity';

@Entity('usuario_rol')
export class UserRole {
  @PrimaryGeneratedColumn()
  id_usuario_rol!: number;

  @Column({ type: 'uuid' })
  id_usuario!: string;

  @ManyToOne(() => Role, (rol) => rol.usuarioRoles)
  @JoinColumn({ name: 'id_rol' })
  rol!: Role;

  @Column()
  id_rol!: number;

  @ManyToOne(() => User, (usuario) => usuario.usuarioRoles)
  @JoinColumn({ name: 'id_usuario' })
  usuario!: User;
}
