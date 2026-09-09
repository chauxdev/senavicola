import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { User } from './entities/user.entity';
import { CallUser } from './entities/call-user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginateAndRespond, StandardPaginationResponse } from '../common/utils/pagination.util';
import { UserRole } from '../roles/entities/user-role.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepo: Repository<User>,
    @InjectRepository(CallUser)
    private readonly llamarUsuarioRepo: Repository<CallUser>,
    @InjectRepository(UserRole)
    private readonly usuarioRolRepo: Repository<UserRole>,
  ) {}

  /**
   * Convierte la entidad User con relaciones en un DTO normalizado para la interfaz.
   * Este mapper mantiene el campo activo en estado `estado` y expone el arreglo de roles.
   */
  private mapUserWithRoles(usuario: User): Omit<User, 'password'> & { roles: Role[]; estado: boolean } {
    const roles = usuario.usuarioRoles?.map((ur) => ur.rol).filter((rol): rol is Role => !!rol) || [];
    const { password, ...rest } = usuario as User & { password?: string };
    return {
      ...rest,
      roles,
      estado: usuario.activo,
    };
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'> & { roles: Role[]; estado: boolean }> {
    const existeEmail = await this.usuarioRepo.findOne({
      where: { email: dto.email },
    });
    if (existeEmail) throw new ConflictException('El email ya está registrado');

    const existeDoc = await this.usuarioRepo.findOne({
      where: { documento: dto.documento },
    });
    if (existeDoc) throw new ConflictException('El documento ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    const { rolId, ...userData } = dto;

    const usuario = this.usuarioRepo.create({
      ...userData,
      password: hashed,
      fecha_creacion: now,
      ultimo_acceso: now,
      activo: userData.activo ?? true,
    });

    const saved = await this.usuarioRepo.save(usuario);

    await this.usuarioRolRepo.save(
      this.usuarioRolRepo.create({
        id_usuario: saved.id_usuario,
        id_rol: rolId,
      }),
    );

    await this.llamarUsuarioRepo.save(
      this.llamarUsuarioRepo.create({
        id_usuario: saved.id_usuario,
        fecha_creacion: now,
        fecha_modificacion: now,
      }),
    );

    const usuarioConRoles = await this.usuarioRepo.findOne({
      where: { id_usuario: saved.id_usuario },
      relations: ['usuarioRoles', 'usuarioRoles.rol'],
    });

    if (!usuarioConRoles) {
      const { password, ...result } = saved;
      return { ...result, roles: [], estado: saved.activo } as Omit<User, 'password'> & { roles: Role[]; estado: boolean };
    }

    return this.mapUserWithRoles(usuarioConRoles);
  }

  async findAll(paginationDto: PaginationDto): Promise<StandardPaginationResponse<Omit<User, 'password'> & { roles: Role[]; estado: boolean }>> {
    const qb = this.usuarioRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.usuarioRoles', 'usuarioRoles')
      .leftJoinAndSelect('usuarioRoles.rol', 'rol');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(user.nombre ILIKE :search OR user.documento ILIKE :search OR user.email ILIKE :search)', { search: s });
    }

    const result = await paginateAndRespond(qb, paginationDto);

    const items = result.data.map((usuario) => this.mapUserWithRoles(usuario as User));

    return {
      ...result,
      data: items as any,
    };
  }

  async findOne(id: string): Promise<Omit<User, 'password'> & { roles: Role[]; estado: boolean }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id_usuario: id },
      relations: [
        'usuarioRoles',
        'usuarioRoles.rol',
        'usuarioRoles.rol.rolPermisos',
        'usuarioRoles.rol.rolPermisos.permiso',
      ],
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return this.mapUserWithRoles(usuario);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usuarioRepo.findOne({
      where: { email },
      relations: [
        'usuarioRoles',
        'usuarioRoles.rol',
        'usuarioRoles.rol.rolPermisos',
        'usuarioRoles.rol.rolPermisos.permiso',
      ],
    });
  }

  async findByDocumento(documento: string): Promise<User | null> {
    return this.usuarioRepo.findOne({
      where: { documento },
      relations: [
        'usuarioRoles',
        'usuarioRoles.rol',
        'usuarioRoles.rol.rolPermisos',
        'usuarioRoles.rol.rolPermisos.permiso',
      ],
    });
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'> & { roles: Role[]; estado: boolean }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id_usuario: id },
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.email && dto.email !== usuario.email) {
      const existeEmail = await this.usuarioRepo.findOne({
        where: { email: dto.email },
      });
      if (existeEmail) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    if (dto.documento && dto.documento !== usuario.documento) {
      const existeDoc = await this.usuarioRepo.findOne({
        where: { documento: dto.documento },
      });
      if (existeDoc) {
        throw new ConflictException('El documento ya está registrado');
      }
    }

    const { rolId, ...userData } = dto as any;

    if (typeof rolId === 'number') {
      await this.usuarioRolRepo.delete({ id_usuario: id });
      await this.usuarioRolRepo.save(
        this.usuarioRolRepo.create({
          id_usuario: id,
          id_rol: rolId,
        }),
      );
    }

    if (typeof userData.activo === 'boolean') {
      usuario.activo = userData.activo;
      usuario.fecha_eliminacion = userData.activo ? undefined : usuario.fecha_eliminacion ?? new Date();
    }

    const updated = Object.assign(usuario, userData);
    const saved = await this.usuarioRepo.save(updated);

    await this.llamarUsuarioRepo.update(
      { id_usuario: id },
      { fecha_modificacion: new Date() },
    );

    const reloaded = await this.usuarioRepo.findOne({
      where: { id_usuario: id },
      relations: ['usuarioRoles', 'usuarioRoles.rol'],
    });
    return reloaded ? this.mapUserWithRoles(reloaded) : this.mapUserWithRoles(saved as User);
  }

  async remove(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id_usuario: id },
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    usuario.activo = false;
    usuario.fecha_eliminacion = usuario.fecha_eliminacion ?? new Date();
    await this.usuarioRepo.save(usuario);

    return { message: `Usuario ${id} inactivado correctamente` };
  }

  async setActiveState(id: string, activo: boolean): Promise<Omit<User, 'password'> & { roles: Role[]; estado: boolean }> {
    const usuario = await this.usuarioRepo.findOne({
      where: { id_usuario: id },
      relations: ['usuarioRoles', 'usuarioRoles.rol'],
    });
    if (!usuario) throw new NotFoundException(`Usuario ${id} no encontrado`);

    usuario.activo = activo;
    usuario.fecha_eliminacion = activo ? undefined : usuario.fecha_eliminacion ?? new Date();
    const saved = await this.usuarioRepo.save(usuario);
    return this.mapUserWithRoles(saved);
  }

  async updateUltimoAcceso(id: string): Promise<void> {
    await this.usuarioRepo.update(id, { ultimo_acceso: new Date() });
  }

  // Método utilitario para obtener o crear llamar_usuario por usuario
  async getLlamarUsuario(id_usuario: string): Promise<CallUser> {
    let llamar = await this.llamarUsuarioRepo.findOne({
      where: { id_usuario },
    });
    if (!llamar) {
      const now = new Date();
      llamar = await this.llamarUsuarioRepo.save(
        this.llamarUsuarioRepo.create({
          id_usuario,
          fecha_creacion: now,
          fecha_modificacion: now,
        }),
      );
    }
    return llamar;
  }
}
