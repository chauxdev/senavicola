import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto, AssignRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly usuarioRolRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existe = await this.rolRepo.findOne({
      where: { nombre: dto.nombre },
    });
    if (existe) throw new BadRequestException(`Rol "${dto.nombre}" ya existe`);
    return this.rolRepo.save(this.rolRepo.create(dto));
  }

  async findAll(): Promise<Role[]> {
    return this.rolRepo.find({
      relations: ['rolPermisos', 'rolPermisos.permiso'],
    });
  }

  async findOne(id: number): Promise<Role> {
    const rol = await this.rolRepo.findOne({
      where: { id_rol: id },
      relations: ['rolPermisos', 'rolPermisos.permiso'],
    });
    if (!rol) throw new NotFoundException(`Rol ${id} no encontrado`);
    return rol;
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const rol = await this.findOne(id);
    
    const protectedRoles = ['ADMINISTRADOR', 'OPERARIO', 'VISITANTE'];
    if (protectedRoles.includes(rol.nombre) && dto.nombre && dto.nombre !== rol.nombre) {
      throw new ForbiddenException(`No se puede renombrar el rol predefinido: ${rol.nombre}`);
    }

    return this.rolRepo.save(Object.assign(rol, dto));
  }

  async remove(id: number): Promise<{ message: string }> {
    const rol = await this.findOne(id);
    
    const protectedRoles = ['ADMINISTRADOR', 'OPERARIO', 'VISITANTE'];
    if (protectedRoles.includes(rol.nombre)) {
      throw new ForbiddenException(`No se puede eliminar el rol predefinido: ${rol.nombre}`);
    }

    await this.rolRepo.remove(rol);
    return { message: `Rol ${id} eliminado correctamente` };
  }

  async assignRolToUser(dto: AssignRoleDto): Promise<UserRole> {
    const existe = await this.usuarioRolRepo.findOne({
      where: { id_usuario: dto.id_usuario, id_rol: dto.id_rol },
    });
    if (existe)
      throw new BadRequestException('El usuario ya tiene este rol asignado');

    return this.usuarioRolRepo.save(this.usuarioRolRepo.create(dto));
  }

  async removeRolFromUser(dto: AssignRoleDto): Promise<{ message: string }> {
    const ur = await this.usuarioRolRepo.findOne({
      where: { id_usuario: dto.id_usuario, id_rol: dto.id_rol },
    });
    if (!ur) throw new NotFoundException('Asignación no encontrada');
    await this.usuarioRolRepo.remove(ur);
    return { message: 'Rol removido del usuario correctamente' };
  }

  async getUserRoles(id_usuario: string): Promise<UserRole[]> {
    return this.usuarioRolRepo.find({
      where: { id_usuario },
      relations: ['rol'],
    });
  }
}
