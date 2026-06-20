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

@Controller('supplies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @RequirePermission('INSUMOS_CREAR')
  create(@Body() dto: CreateSupplyDto) {
    return this.suppliesService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateSupplyDto) {
    return this.suppliesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('INSUMOS_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.suppliesService.remove(id);
  }
}
