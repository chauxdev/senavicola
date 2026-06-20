import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupplyHistoryService } from './supply-history.service';
import { CreateSupplyHistoryDto } from './dto/create-supply-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('supply-history')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplyHistoryController {
  constructor(private readonly supplyHistoryService: SupplyHistoryService) {}

  @Post()
  @RequirePermission('INSUMOS_EDITAR')
  create(@Body() dto: CreateSupplyHistoryDto) {
    return this.supplyHistoryService.create(dto);
  }

  @Get()
  @RequirePermission('INSUMOS_VER')
  findAll() {
    return this.supplyHistoryService.findAll();
  }

  @Get('by-supply/:idInsumo')
  @RequirePermission('INSUMOS_VER')
  findByInsumo(@Param('idInsumo') idInsumo: string) {
    return this.supplyHistoryService.findByInsumo(idInsumo);
  }

  @Get(':id')
  @RequirePermission('INSUMOS_VER')
  findOne(@Param('id') id: string) {
    return this.supplyHistoryService.findOne(id);
  }
}
