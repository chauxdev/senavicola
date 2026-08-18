import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { Breed } from '../../breeds/entities/breed.entity';
import { EggType } from '../../egg-types/entities/egg-type.entity';
import { SupplyCategory } from '../../supply-categories/entities/supply-category.entity';
import { MeasurementUnit } from '../../measurement-units/entities/measurement-unit.entity';
import { SupplyAction } from '../../supply-actions/entities/supply-action.entity';
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
        @InjectRepository(Breed)
        private readonly breedRepository: Repository<Breed>,
        @InjectRepository(EggType)
        private readonly eggTypeRepository: Repository<EggType>,
        @InjectRepository(SupplyCategory)
        private readonly supplyCategoryRepository: Repository<SupplyCategory>,
        @InjectRepository(MeasurementUnit)
        private readonly measurementUnitRepository: Repository<MeasurementUnit>,
        @InjectRepository(SupplyAction)
        private readonly supplyActionRepository: Repository<SupplyAction>,
    ) { }

    async run() {
        await this.seedRoles();
        await this.seedPermissions();
        await this.seedRolePermissions();
        await this.seedUsers();
        await this.seedBreeds();
        await this.seedEggTypes();
        await this.seedSupplyCategories();
        await this.seedMeasurementUnits();
        await this.seedSupplyActions();
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

        let adminUser: User;

        if (!adminExiste) {
            adminUser = await this.usersRepository.save({
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
                id_usuario: adminUser.id_usuario,
                id_rol: rolAdmin.id_rol,
            });

            console.log('✓ Usuario admin creado: documento=000000 / contraseña=Admin123');
        } else {
            await this.usersRepository.update(
                { documento: '000000' },
                { password }
            );
            adminUser = adminExiste;
            console.log('✓ Admin existente: contraseña actualizada a Admin123');
        }

        // Asegurar que exista el registro en llamar_usuario para el admin
        const adminLlamar = await this.usersRepository.query(
            `SELECT * FROM llamar_usuario WHERE id_usuario = $1`,
            [adminUser.id_usuario]
        );
        if (adminLlamar.length === 0) {
            await this.usersRepository.query(
                `INSERT INTO llamar_usuario (id_usuario) VALUES ($1)`,
                [adminUser.id_usuario]
            );
            console.log('✓ Registro llamar_usuario creado para el admin');
        }

        // --- Usuario Operario (Aprendiz) ---
        const operarioExiste = await this.usersRepository.findOne({
            where: { documento: '111111' },
        });

        const passwordOperario = await bcrypt.hash('Operario123', 10);
        let operarioUser: User;

        if (!operarioExiste) {
            operarioUser = await this.usersRepository.save({
                email: 'operario@test.com',
                password: passwordOperario,
                nombre: 'Operario',
                apellido: 'Aprendiz',
                documento: '111111',
                activo: true,
            });

            const rolAprendiz = await this.rolesRepository.findOne({
                where: { nombre: 'aprendiz' },
            });

            if (!rolAprendiz) throw new Error('Rol aprendiz no encontrado');

            await this.userRoleRepository.save({
                id_usuario: operarioUser.id_usuario,
                id_rol: rolAprendiz.id_rol,
            });

            console.log('✓ Usuario Operario creado: documento=111111 / contraseña=Operario123');
        } else {
            await this.usersRepository.update(
                { documento: '111111' },
                { password: passwordOperario }
            );
            operarioUser = operarioExiste;
            console.log('✓ Operario existente: contraseña actualizada a Operario123');
        }

        const operarioLlamar = await this.usersRepository.query(
            `SELECT * FROM llamar_usuario WHERE id_usuario = $1`,
            [operarioUser.id_usuario]
        );
        if (operarioLlamar.length === 0) {
            await this.usersRepository.query(
                `INSERT INTO llamar_usuario (id_usuario) VALUES ($1)`,
                [operarioUser.id_usuario]
            );
            console.log('✓ Registro llamar_usuario creado para el operario');
        }
    }

    private async seedBreeds() {
        const breeds = [
            { nombre: 'Isa Browns', descripcion: 'Raza Isa Browns' },
            { nombre: 'Austra Blanco', descripcion: 'Raza Austra Blanco' },
            { nombre: 'Lohmann Marrón', descripcion: 'Raza Lohmann Marrón' },
            { nombre: 'Estrella Negra', descripcion: 'Raza Estrella Negra' },
            { nombre: 'Plymouth Rocks', descripcion: 'Raza Plymouth Rocks' },
            { nombre: 'Rhode Island Rojo', descripcion: 'Raza Rhode Island Rojo' },
        ];
        for (const breedData of breeds) {
            const existe = await this.breedRepository.findOne({ where: { nombre: breedData.nombre } });
            if (!existe) {
                await this.breedRepository.save(breedData);
                console.log(`Raza creada: ${breedData.nombre}`);
            } else {
                console.log(`Raza ya existe: ${breedData.nombre}`);
            }
        }
    }

    private async seedEggTypes() {
        const eggTypes = [
            { tipo: 'Jumbo', peso_min: 73, peso_max: null },
            { tipo: 'AAA', peso_min: 63, peso_max: 73 },
            { tipo: 'AA', peso_min: 53, peso_max: 63 },
            { tipo: 'A', peso_min: 43, peso_max: 53 },
            { tipo: 'B', peso_min: 33, peso_max: 43 },
            { tipo: 'C', peso_min: null, peso_max: 33 },
        ];
        for (const et of eggTypes) {
            const existe = await this.eggTypeRepository.findOne({ where: { tipo: et.tipo } });
            if (!existe) {
                await this.eggTypeRepository.save(et);
                console.log(`Tipo de huevo creado: ${et.tipo}`);
            } else {
                console.log(`Tipo de huevo ya existe: ${et.tipo}`);
            }
        }
    }

    private async seedSupplyCategories() {
        const categories = [
            { nombre_categoria: 'Alimentos' },
            { nombre_categoria: 'Herramientas' },
            { nombre_categoria: 'Medicamentos' },
        ];
        for (const cat of categories) {
            const existe = await this.supplyCategoryRepository.findOne({ where: { nombre_categoria: cat.nombre_categoria } });
            if (!existe) {
                await this.supplyCategoryRepository.save(cat);
                console.log(`Categoría de insumo creada: ${cat.nombre_categoria}`);
            } else {
                console.log(`Categoría de insumo ya existe: ${cat.nombre_categoria}`);
            }
        }
    }

    private async seedMeasurementUnits() {
        const units = [
            { nombre: 'Kilos', abreviatura: 'kg' },
            { nombre: 'Unidades', abreviatura: 'und' },
            { nombre: 'Litros', abreviatura: 'L' },
            { nombre: 'Gramos', abreviatura: 'g' },
        ];
        for (const unit of units) {
            const existe = await this.measurementUnitRepository.findOne({ where: { nombre: unit.nombre } });
            if (!existe) {
                await this.measurementUnitRepository.save(unit);
                console.log(`Unidad de medida creada: ${unit.nombre}`);
            } else {
                console.log(`Unidad de medida ya existe: ${unit.nombre}`);
            }
        }
    }

    private async seedSupplyActions() {
        const actions = ['AJUSTE', 'ENTRADA', 'SALIDA'];
        for (const action of actions) {
            const existe = await this.supplyActionRepository.findOne({ where: { nombre: action } });
            if (!existe) {
                await this.supplyActionRepository.save({ nombre: action });
                console.log(`Acción de historial de insumo creada: ${action}`);
            } else {
                console.log(`Acción de historial de insumo ya existe: ${action}`);
            }
        }
    }
}
