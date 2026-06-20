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
import { SupplyCategoriesService } from './supply-categories.service';
import { CreateSupplyCategoryDto } from './dto/create-supply-category.dto';
import { UpdateSupplyCategoryDto } from './dto/update-supply-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('supply-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplyCategoriesController {
  constructor(
    private readonly supplyCategoriesService: SupplyCategoriesService,
  ) {}

  @Post()
  @RequirePermission('CATEGORIAS_CREAR')
  create(@Body() dto: CreateSupplyCategoryDto) {
    return this.supplyCategoriesService.create(dto);
  }

  @Get()
  @RequirePermission('CATEGORIAS_VER')
  findAll() {
    return this.supplyCategoriesService.findAll();
  }

  @Get(':id')
  @RequirePermission('CATEGORIAS_VER')
  findOne(@Param('id') id: string) {
    return this.supplyCategoriesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('CATEGORIAS_EDITAR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyCategoryDto,
  ) {
    return this.supplyCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('CATEGORIAS_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.supplyCategoriesService.remove(id);
  }
}
