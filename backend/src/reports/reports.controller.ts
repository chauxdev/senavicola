import { Controller, Get, Post, Body, Param, UseGuards, Res, Query } from '@nestjs/common';
import express from 'express';
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

  @Get(':id/download')
  @RequirePermission('REPORTES_VER')
  async download(
    @Param('id') id: string,
    @Res() res: express.Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const { filename, buffer } = await this.service.generateCsvBuffer(id, fechaInicio, fechaFin);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(buffer);
  }

  @Get(':id/download-pdf')
  @RequirePermission('REPORTES_VER')
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: express.Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const { filename, buffer } = await this.service.generatePdfBuffer(id, fechaInicio, fechaFin);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  }

  @Get(':id')
  @RequirePermission('REPORTES_VER')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
