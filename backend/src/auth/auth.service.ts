import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '../users/entities/user.entity';
import { RbacService } from './rbac.service';
import { BASE_ROLES } from './rbac.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  /**
   * Construye a partir del usuario la lista de roles y permisos actualizados.
   * Esta función se usa para no confiar únicamente en el payload del JWT.
   */
  private buildAuthCollections(usuario: User) {
    const roles = usuario.usuarioRoles?.map((ur) => ur.rol?.nombre).
      filter((r): r is string => typeof r === 'string') || [];

    const permisosSet = new Set<string>();
    usuario.usuarioRoles?.forEach((ur) => {
      ur.rol?.rolPermisos?.forEach((rp) => {
        if (rp.permiso?.nombre) permisosSet.add(rp.permiso.nombre);
      });
    });

    return {
      roles,
      permissions: Array.from(permisosSet),
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; usuario: Omit<User, 'password'> & { roles: string[], permissions: string[] } }> {
    this.logger.log(`Intentando login para el documento: ${dto.documento}`);

    // 1. Buscar el usuario
    const usuario = await this.usersService.findByDocumento(dto.documento);

    if (!usuario) {
      this.logger.error(`Usuario no encontrado con documento: ${dto.documento}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Verificar si está activo
    if (!usuario.activo) {
      this.logger.warn(`Intento de entrada con usuario inactivo (documento: ${dto.documento})`);
      throw new UnauthorizedException(
        'Usuario inactivo. Contacte al administrador',
      );
    }

    // 3. Comparar contraseña
    const passwordMatch = await bcrypt.compare(dto.password, usuario.password);

    if (!passwordMatch) {
      this.logger.error('La contraseña no coincide');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Actualizar último acceso
    try {
      await this.usersService.updateUltimoAcceso(usuario.id_usuario);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error al actualizar último acceso: ${message}`,
      );
    }

    const { roles, permissions } = this.buildAuthCollections(usuario);

    // 6. Generar Payload y Token
    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      email: usuario.email,
      roles,
      permissions,
    };

    const { password, ...usuarioSinPassword } = usuario;

    this.logger.log(`Login exitoso para documento: ${dto.documento}`);

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        ...usuarioSinPassword,
        roles,
        permissions,
      },
    };
  }

  async loginGuest() {
    this.logger.log('Login como invitado');

    const { roles, permissions } = await this.rbacService.loadRoleAuthorization(
      BASE_ROLES.VISITANTE,
    );

    const payload: JwtPayload = {
      sub: 'guest',
      email: 'guest@senavicola.com',
      roles,
      permissions,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id_usuario: 'guest',
        nombre: 'Invitado',
        apellido: '',
        documento: '000000000',
        email: 'guest@senavicola.com',
        activo: true,
        roles,
        permissions,
      },
    };
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Token inválido: ${message}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
