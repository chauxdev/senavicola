import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto, AssignRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermission('ROLES_CREAR')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermission('ROLES_VER')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermission('ROLES_VER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('ROLES_EDITAR')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('ROLES_ELIMINAR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Post('assign')
  @RequirePermission('ROLES_EDITAR')
  assignRol(@Body() dto: AssignRoleDto) {
    return this.rolesService.assignRolToUser(dto);
  }

  @Delete('assign/remove')
  @RequirePermission('ROLES_EDITAR')
  removeRol(@Body() dto: AssignRoleDto) {
    return this.rolesService.removeRolFromUser(dto);
  }

  @Get('user/:id_usuario')
  @RequirePermission('ROLES_VER')
  getUserRoles(@Param('id_usuario') id_usuario: string) {
    return this.rolesService.getUserRoles(id_usuario);
  }

  @Patch(':id/permissions')
  @RequirePermission('ROLES_EDITAR')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { permissionIds: number[] },
  ) {
    return this.rolesService.setRolePermissions(id, dto.permissionIds || []);
  }
}
