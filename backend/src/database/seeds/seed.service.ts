import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
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
    ) { }

    async run() {
        await this.seedRoles();
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
            // Actualizar la contraseña si el usuario ya existe
            await this.usersRepository.update(
                { documento: '000000' },
                { password }
            );
            console.log('✓ Admin existente: contraseña actualizada a Admin123');
        }
    }
}
