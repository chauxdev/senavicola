import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { PERMISSIONS_CATALOG } from '../../permissions/permissions.constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
    ) { }

    async run() {
        await this.seedRoles();
        await this.seedPermissions();
        await this.seedRolePermissions();
        await this.seedUsers();
        console.log('Seed ejecutado correctamente');
    }

    private async seedRoles() {
        const roles = ['admin', 'aprendiz', 'visitante'];
        for (const nombre of roles) {
            const existe = await this.rolesRepository.findOne({ where: { nombre } });
            if (!existe) {
                await this.rolesRepository.save({ nombre });
                console.log(`Rol creado: ${nombre}`);
            } else {
                console.log(`Rol ya existe: ${nombre}`);
            }
        }
    }

    private async seedPermissions() {
        for (const permission of PERMISSIONS_CATALOG) {
            const existe = await this.permissionRepository.findOne({
                where: { nombre: permission.nombre },
            });
            if (!existe) {
                await this.permissionRepository.save({
                    codigo: permission.codigo,
                    nombre: permission.nombre,
                    descripcion: permission.descripcion,
                });
                console.log(`Permiso creado: ${permission.nombre}`);
            } else {
                console.log(`Permiso ya existe: ${permission.nombre}`);
            }
        }
    }

    private async seedRolePermissions() {
        const allPermissions = await this.permissionRepository.find();
        const readPermissions = allPermissions.filter((permission) =>
            permission.nombre.endsWith('_VER'),
        );

        const roleAssignments: Array<{ roleName: string; permissions: Permission[] }> = [
            { roleName: 'admin', permissions: allPermissions },
            { roleName: 'visitante', permissions: readPermissions },
            { roleName: 'aprendiz', permissions: readPermissions },
        ];

        for (const assignment of roleAssignments) {
            const role = await this.rolesRepository.findOne({
                where: { nombre: assignment.roleName },
            });

            if (!role) {
                console.warn(`Rol no encontrado para asignación de permisos: ${assignment.roleName}`);
                continue;
            }

            const existingAssignments = await this.rolePermissionRepository.find({
                where: { id_rol: role.id_rol },
            });
            const existingPermissionIds = new Set(
                existingAssignments.map((assignmentRow) => assignmentRow.id_permiso),
            );

            const permissionsToAssign = assignment.permissions.filter(
                (permission) => !existingPermissionIds.has(permission.id_permiso),
            );

            if (permissionsToAssign.length === 0) {
                console.log(`Permisos base ya asignados al rol: ${assignment.roleName}`);
                continue;
            }

            await this.rolePermissionRepository.save(
                permissionsToAssign.map((permission) =>
                    this.rolePermissionRepository.create({
                        id_rol: role.id_rol,
                        id_permiso: permission.id_permiso,
                    }),
                ),
            );

            console.log(
                `Permisos asignados al rol ${assignment.roleName}: ${permissionsToAssign.length}`,
            );
        }
    }

    private async seedUsers() {
        const adminExiste = await this.usersRepository.findOne({
            where: { documento: '000000' },
        });

        const password = await bcrypt.hash('Admin123', 10);

        if (!adminExiste) {
            const admin = await this.usersRepository.save({
                email: 'admin@test.com',
                password,
                nombre: 'Admin',
                apellido: 'Admin',
                documento: '000000',
                activo: true,
            });

            const rolAdmin = await this.rolesRepository.findOne({
                where: { nombre: 'admin' },
            });

            if (!rolAdmin) throw new Error('Rol admin no encontrado');

            await this.userRoleRepository.save({
                id_usuario: admin.id_usuario,
                id_rol: rolAdmin.id_rol,
            });

            console.log('✓ Usuario admin creado: documento=000000 / contraseña=Admin123');
        } else {
            await this.usersRepository.update(
                { documento: '000000' },
                { password }
            );
            console.log('✓ Admin existente: contraseña actualizada a Admin123');
        }
    }
}
