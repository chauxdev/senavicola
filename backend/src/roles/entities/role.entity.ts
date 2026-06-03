import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';

@Entity('rol')
export class Role {
  @PrimaryGeneratedColumn()
  id_rol!: number;

  @Column({ length: 255 })
  nombre!: string;

  @OneToMany(() => UserRole, (ur) => ur.rol)
  usuarioRoles!: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.rol)
  rolPermisos!: RolePermission[];
}
