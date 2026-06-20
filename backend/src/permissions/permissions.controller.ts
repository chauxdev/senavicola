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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import {
  UpdatePermissionDto,
  AssignPermissionDto,
} from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermission('PERMISOS_CREAR')
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @RequirePermission('PERMISOS_VER')
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('matrix')
  @RequirePermission('PERMISOS_VER')
  getPermissionMatrix() {
    return this.permissionsService.getPermissionMatrix();
  }

  @Get(':id')
  @RequirePermission('PERMISOS_VER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('PERMISOS_EDITAR')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('PERMISOS_ELIMINAR')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }

  @Post('assign')
  @RequirePermission('PERMISOS_EDITAR')
  assignPermiso(@Body() dto: AssignPermissionDto) {
    return this.permissionsService.assignPermisoToRol(dto);
  }

  @Delete('assign/remove')
  @RequirePermission('PERMISOS_EDITAR')
  removePermiso(@Body() dto: AssignPermissionDto) {
    return this.permissionsService.removePermisoFromRol(dto);
  }

  @Get('rol/:id_rol')
  @RequirePermission('PERMISOS_VER')
  getRolPermisos(@Param('id_rol', ParseIntPipe) id_rol: number) {
    return this.permissionsService.getRolPermisos(id_rol);
  }
}
