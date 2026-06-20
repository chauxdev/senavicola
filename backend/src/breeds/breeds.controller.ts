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
import { BreedsService } from './breeds.service';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('breeds')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @Post()
  @RequirePermission('RAZAS_CREAR')
  create(@Body() dto: CreateBreedDto) {
    return this.breedsService.create(dto);
  }

  @Get()
  @RequirePermission('RAZAS_VER')
  findAll() {
    return this.breedsService.findAll();
  }

  @Get(':id')
  @RequirePermission('RAZAS_VER')
  findOne(@Param('id') id: string) {
    return this.breedsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('RAZAS_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateBreedDto) {
    return this.breedsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('RAZAS_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.breedsService.remove(id);
  }
}
