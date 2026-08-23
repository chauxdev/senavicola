import { Body, Controller, Get, Post, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const result = await this.authService.login(dto);
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    // Forzar el Set-Cookie si el interceptor lo bloquea
    response.setHeader('Set-Cookie', `access_token=${result.access_token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
    return { message: 'Login exitoso', user: result.usuario };
  }

  @Post('guest')
  @ApiOperation({ summary: 'Iniciar sesión como invitado' })
  async loginGuest(@Res({ passthrough: true }) response: any) {
    const result = await this.authService.loginGuest();
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    // Forzar el Set-Cookie si el interceptor lo bloquea
    response.setHeader('Set-Cookie', `access_token=${result.access_token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
    return { message: 'Login exitoso', user: result.usuario };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@GetUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil completo del usuario autenticado' })
  getMe(@GetUser() user: any) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar validez del token actual' })
  checkToken(@GetUser() user: any) {
    return { valid: true, user };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión (limpiar cookie)' })
  logout(@Res({ passthrough: true }) response: any) {
    response.clearCookie('access_token');
    return { message: 'Sesión cerrada exitosamente' };
  }
}
