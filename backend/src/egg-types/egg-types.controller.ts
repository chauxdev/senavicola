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
import { EggTypesService } from './egg-types.service';
import { CreateEggTypeDto } from './dto/create-egg-type.dto';
import { UpdateEggTypeDto } from './dto/update-egg-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('egg-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EggTypesController {
  constructor(private readonly eggTypesService: EggTypesService) {}

  @Post()
  @RequirePermission('HUEVOS_CREAR')
  create(@Body() createEggTypeDto: CreateEggTypeDto) {
    return this.eggTypesService.create(createEggTypeDto);
  }

  @Get()
  @RequirePermission('HUEVOS_VER')
  findAll() {
    return this.eggTypesService.findAll();
  }

  @Get(':id')
  @RequirePermission('HUEVOS_VER')
  findOne(@Param('id') id: string) {
    return this.eggTypesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('HUEVOS_EDITAR')
  update(@Param('id') id: string, @Body() updateEggTypeDto: UpdateEggTypeDto) {
    return this.eggTypesService.update(id, updateEggTypeDto);
  }

  @Delete(':id')
  @RequirePermission('HUEVOS_EDITAR')
  remove(@Param('id') id: string) {
    return this.eggTypesService.remove(id);
  }
}
