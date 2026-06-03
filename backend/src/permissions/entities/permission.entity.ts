import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';

@Entity('permiso')
export class Permission {
  @PrimaryGeneratedColumn()
  id_permiso!: number;

  @Column()
  codigo!: number;

  @Column({ length: 255 })
  nombre!: string;

  @Column({ length: 255 })
  descripcion!: string;

  @OneToMany(() => RolePermission, (rp) => rp.permiso)
  rolPermisos!: RolePermission[];
}
