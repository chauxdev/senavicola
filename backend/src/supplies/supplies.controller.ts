import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('supplies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @RequirePermission('INSUMOS_CREAR')
  create(@Body() dto: CreateSupplyDto, @GetUser() user: any) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.suppliesService.create(dto, userDisplayName, user);
  }

  @Get()
  @RequirePermission('INSUMOS_VER')
  findAll(@Query() paginationDto: PaginationDto) {
    return this.suppliesService.findAll(paginationDto);
  }

  @Get(':id')
  @RequirePermission('INSUMOS_VER')
  findOne(@Param('id') id: string) {
    return this.suppliesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('INSUMOS_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateSupplyDto, @GetUser() user: any) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.suppliesService.update(id, dto, userDisplayName);
  }

  @Post(':id/reabastecer')
  @RequirePermission('INSUMOS_EDITAR')
  reabastecer(
    @Param('id') id: string,
    @Body() dto: { cantidad: number; motivo: string },
    @GetUser() user: any
  ) {
    const userDisplayName = user ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Sistema';
    return this.suppliesService.reabastecer(id, dto.cantidad, dto.motivo, userDisplayName);
  }

  @Delete(':id')
  @RequirePermission('INSUMOS_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.suppliesService.remove(id);
  }
}
