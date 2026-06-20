import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @RequirePermission('REPORTES_CREAR')
  create(@Body() dto: CreateReportDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermission('REPORTES_VER')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermission('REPORTES_VER')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
