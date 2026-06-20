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
import { BarnsService } from './barns.service';
import { CreateBarnDto } from './dto/create-barn.dto';
import { UpdateBarnDto } from './dto/update-barn.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('barns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BarnsController {
  constructor(private readonly barnsService: BarnsService) {}

  @Post()
  @RequirePermission('GALPONES_CREAR')
  create(@Body() dto: CreateBarnDto) {
    return this.barnsService.create(dto);
  }

  @Get()
  @RequirePermission('GALPONES_VER')
  findAll() {
    return this.barnsService.findAll();
  }

  @Get(':id')
  @RequirePermission('GALPONES_VER')
  findOne(@Param('id') id: string) {
    return this.barnsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('GALPONES_EDITAR')
  update(@Param('id') id: string, @Body() dto: UpdateBarnDto) {
    return this.barnsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('GALPONES_ELIMINAR')
  remove(@Param('id') id: string) {
    return this.barnsService.remove(id);
  }
}
