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
import { MeasurementUnitsService } from './measurement-units.service';
import { CreateMeasurementUnitDto } from './dto/create-measurement-unit.dto';
import { UpdateMeasurementUnitDto } from './dto/update-measurement-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('measurement-units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MeasurementUnitsController {
  constructor(
    private readonly measurementUnitsService: MeasurementUnitsService,
  ) {}

  @Post()
  @RequirePermission('UNIDADES_MEDIDA_CREAR')
  create(@Body() dto: CreateMeasurementUnitDto) {
    return this.measurementUnitsService.create(dto);
  }

  @Get()
  @RequirePermission('UNIDADES_MEDIDA_VER')
  findAll() {
    return this.measurementUnitsService.findAll();
  }

  @Get(':id')
  @RequirePermission('UNIDADES_MEDIDA_VER')
  findOne(@Param('id') id: string) {
    return this.measurementUnitsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('UNIDADES_MEDIDA_EDITAR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMeasurementUnitDto,
  ) {
    return this.measurementUnitsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('UNIDADES_MEDIDA_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.measurementUnitsService.remove(id);
  }
}
