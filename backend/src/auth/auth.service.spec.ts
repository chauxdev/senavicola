import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      updateUltimoAcceso: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mocked_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(service.login({ email: 'test@test.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const mockUser = { id_usuario: '1', email: 'test@test.com', password: 'hashed_password', activo: true };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong_password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return access token if credentials are valid', async () => {
      const mockUser = { 
        id_usuario: '1', 
        email: 'test@test.com', 
        password: 'hashed_password', 
        activo: true,
        usuarioRoles: [{ rol: { nombre: 'ADMIN' } }]
      };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@test.com', password: 'password' });

      expect(result).toHaveProperty('access_token');
      expect(result.usuario.email).toBe('test@test.com');
      expect(usersService.updateUltimoAcceso).toHaveBeenCalledWith('1');
    });
  });
});
