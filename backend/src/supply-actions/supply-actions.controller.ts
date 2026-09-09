import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SupplyActionsService } from './supply-actions.service';
import { CreateSupplyActionDto } from './dto/create-supply-action.dto';
import { UpdateSupplyActionDto } from './dto/update-supply-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('supply-actions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplyActionsController {
  constructor(private readonly supplyActionsService: SupplyActionsService) {}

  @Post()
  @RequirePermission('INSUMOS_CREAR')
  create(@Body() dto: CreateSupplyActionDto) {
    return this.supplyActionsService.create(dto);
  }

  @Get()
  @RequirePermission('INSUMOS_VER')
  findAll() {
    return this.supplyActionsService.findAll();
  }

  @Get(':id')
  @RequirePermission('INSUMOS_VER')
  findOne(@Param('id') id: string) {
    return this.supplyActionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('INSUMOS_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateSupplyActionDto) {
    return this.supplyActionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('INSUMOS_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.supplyActionsService.remove(id);
  }
}
