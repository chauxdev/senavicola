import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';

import { EggInventoryService } from './egg-inventory.service';
import { RegisterEggProductionDto } from './dto/register-egg-production.dto';
import { RegisterDamagedEggsDto } from './dto/register-damaged-eggs.dto';
import { UpdateEggInventoryDto } from './dto/update-egg-inventory.dto';
import { EggFilterDto } from './dto/egg-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('egg-inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EggInventoryController {
  constructor(private readonly service: EggInventoryService) {}

  @Post('produccion')
  @RequirePermission('HUEVOS_CREAR')
  registerProduction(@Body() dto: RegisterEggProductionDto) {
    return this.service.registerProduction(dto);
  }

  @Post('danados')
  @RequirePermission('HUEVOS_CREAR')
  registerDamaged(@Body() dto: RegisterDamagedEggsDto) {
    return this.service.registerDamaged(dto);
  }

  @Get('danados')
  @RequirePermission('HUEVOS_VER')
  findDamaged(@Query() paginationDto: EggFilterDto) {
    return this.service.findDamaged(paginationDto);
  }

  @Get()
  @RequirePermission('HUEVOS_VER')
  findAll(@Query() paginationDto: EggFilterDto) {
    return this.service.findAll(paginationDto);
  }

  @Get('historial')
  @RequirePermission('HUEVOS_VER')
  getHistory(@Query() paginationDto: PaginationDto) {
    return this.service.getHistory(paginationDto);
  }

  @Get('reporte/:periodo')
  @RequirePermission('HUEVOS_VER')
  getProductionReport(
    @Param('periodo') periodo: 'semanal' | 'mensual' | 'trimestral',
    @Query() paginationDto: PaginationDto
  ) {
    if (!['semanal', 'mensual', 'trimestral'].includes(periodo)) {
      periodo = 'semanal'; // default fallback or throw BadRequest
    }
    return this.service.getProductionReport(periodo, paginationDto);
  }

  @Get(':id')
  @RequirePermission('HUEVOS_VER')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('HUEVOS_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateEggInventoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('HUEVOS_EDITAR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
