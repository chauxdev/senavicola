import { Controller, Post, Body, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('alimentacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeedingController {
  constructor(private readonly service: FeedingService) {}

  @Post()
  @RequirePermission('LOTES_EDITAR')
  create(@Body() dto: CreateFeedingDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission('LOTES_VER')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermission('LOTES_VER')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @RequirePermission('LOTES_EDITAR')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
