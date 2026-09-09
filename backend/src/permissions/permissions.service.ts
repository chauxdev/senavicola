import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from '../roles/entities/role.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import {
  UpdatePermissionDto,
  AssignPermissionDto,
} from './dto/update-permission.dto';
import { PERMISSION_NAMES } from './permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permisoRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolPermisoRepo: Repository<RolePermission>,
    @InjectRepository(Role)
    private readonly rolRepo: Repository<Role>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    if (!PERMISSION_NAMES.map((p) => String(p)).includes(String(dto.nombre))) {
      throw new BadRequestException(
        `Permiso no permitido: ${dto.nombre}. Use un permiso del catálogo fijo.`,
      );
    }

    const existe = await this.permisoRepo.findOne({
      where: { codigo: dto.codigo },
    });
    if (existe)
      throw new BadRequestException(
        `Permiso con código ${dto.codigo} ya existe`,
      );
    return this.permisoRepo.save(this.permisoRepo.create(dto));
  }

  async findAll(): Promise<Permission[]> {
    return this.permisoRepo.find();
  }

  async findOne(id: number): Promise<Permission> {
    const permiso = await this.permisoRepo.findOne({
      where: { id_permiso: id },
    });
    if (!permiso) throw new NotFoundException(`Permiso ${id} no encontrado`);
    return permiso;
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permiso = await this.findOne(id);

    if (dto.codigo !== undefined && dto.codigo !== permiso.codigo) {
      const existing = await this.permisoRepo.findOne({
        where: { codigo: dto.codigo },
      });
      if (existing && existing.id_permiso !== id) {
        throw new ConflictException(`Permiso con código ${dto.codigo} ya existe`);
      }
    }

    if (dto.nombre && dto.nombre !== permiso.nombre) {
      const existing = await this.permisoRepo.findOne({
        where: { nombre: dto.nombre },
      });
      if (existing && existing.id_permiso !== id) {
        throw new ConflictException(`Permiso "${dto.nombre}" ya existe`);
      }
    }

    return this.permisoRepo.save(Object.assign(permiso, dto));
  }

  async remove(id: number): Promise<{ message: string }> {
    const permiso = await this.findOne(id);
    await this.permisoRepo.remove(permiso);
    return { message: `Permiso ${id} eliminado correctamente` };
  }

  async assignPermisoToRol(dto: AssignPermissionDto): Promise<RolePermission> {
    const existe = await this.rolPermisoRepo.findOne({
      where: { id_rol: dto.id_rol, id_permiso: dto.id_permiso },
    });
    if (existe)
      throw new BadRequestException('El rol ya tiene este permiso asignado');
    return this.rolPermisoRepo.save(this.rolPermisoRepo.create(dto));
  }

  async removePermisoFromRol(
    dto: AssignPermissionDto,
  ): Promise<{ message: string }> {
    const rp = await this.rolPermisoRepo.findOne({
      where: { id_rol: dto.id_rol, id_permiso: dto.id_permiso },
    });
    if (!rp) throw new NotFoundException('Asignación no encontrada');
    await this.rolPermisoRepo.remove(rp);
    return { message: 'Permiso removido del rol correctamente' };
  }

  async getRolPermisos(id_rol: number): Promise<RolePermission[]> {
    return this.rolPermisoRepo.find({
      where: { id_rol },
      relations: ['permiso'],
    });
  }

  async getPermissionMatrix(): Promise<{ roles: Role[]; permissions: Permission[] }> {
    const roles = await this.rolRepo.find({
      relations: ['rolPermisos', 'rolPermisos.permiso'],
    });
    const permissions = await this.permisoRepo.find();
    return { roles, permissions };
  }
}
