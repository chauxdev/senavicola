import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('rol_permiso')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id_rol_permiso: number;

  @Column()
  id_permiso: number;

  @Column()
  id_rol: number;

  @ManyToOne(() => Permission, (permiso) => permiso.rolPermisos)
  @JoinColumn({ name: 'id_permiso' })
  permiso: Permission;

  @ManyToOne(() => Role, (rol) => rol.rolPermisos)
  @JoinColumn({ name: 'id_rol' })
  rol: Role;
}
