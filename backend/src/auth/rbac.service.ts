import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Role } from '../roles/entities/role.entity';
import {
  BASE_ROLES,
  extractPermissionsFromUser,
  extractRoleNamesFromUser,
} from './rbac.util';

export interface UserAuthorization {
  roles: string[];
  permissions: string[];
}

@Injectable()
export class RbacService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async resolveAuthorization(user: {
    id_usuario?: string;
    sub?: string;
  }): Promise<UserAuthorization> {
    const userId = user.id_usuario || user.sub;

    if (!userId || userId === 'guest') {
      return this.loadRoleAuthorization(BASE_ROLES.VISITANTE);
    }

    const fullUser = await this.usersService.findOne(String(userId));
    return {
      roles: extractRoleNamesFromUser(fullUser),
      permissions: extractPermissionsFromUser(fullUser),
    };
  }

  async loadRoleAuthorization(roleName: string): Promise<UserAuthorization> {
    const role = await this.roleRepository.findOne({
      where: { nombre: roleName },
      relations: ['rolPermisos', 'rolPermisos.permiso'],
    });

    if (!role) {
      return { roles: [roleName], permissions: [] };
    }

    const permissions = new Set<string>();
    role.rolPermisos?.forEach((rolePermission) => {
      if (rolePermission.permiso?.nombre) {
        permissions.add(rolePermission.permiso.nombre);
      }
    });

    return {
      roles: [role.nombre],
      permissions: Array.from(permissions),
    };
  }
}
