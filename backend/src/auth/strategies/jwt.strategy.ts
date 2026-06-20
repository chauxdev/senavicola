import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { RbacService } from '../rbac.service';
import {
  extractPermissionsFromUser,
  extractRoleNamesFromUser,
} from '../rbac.util';

export interface JwtPayload {
  sub: string; // id_usuario (UUID)
  email: string;
  roles: string[];
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly rbacService: RbacService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET no está definido en .env');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<Partial<User> & { roles: string[]; permissions: string[] }> {
    if (payload.sub === 'guest') {
      const authorization = await this.rbacService.loadRoleAuthorization('visitante');
      return {
        id_usuario: 'guest',
        nombre: 'Invitado',
        apellido: '',
        email: 'guest@senavicola.com',
        documento: '000000000',
        activo: true,
        roles: authorization.roles,
        permissions: authorization.permissions,
      };
    }

    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.activo) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    const roles = extractRoleNamesFromUser(user);
    const permissions = extractPermissionsFromUser(user);

    return {
      ...user,
      roles,
      permissions,
    };
  }
}
