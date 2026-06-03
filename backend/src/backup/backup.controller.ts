import { Controller, Get, Post, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('backup')
  @RequirePermission('CONFIGURACION_VER')
  async createBackup() {
    return this.backupService.createBackup();
  }

  @Get('backup/download')
  @RequirePermission('CONFIGURACION_VER')
  async downloadBackup(@Res() res: any) {
    const result = await this.backupService.createBackup();
    const filePath = result.data.path;
    
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
    res.setHeader('Content-Type', 'application/sql');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('backups')
  @RequirePermission('CONFIGURACION_VER')
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Post('restore')
  @RequirePermission('CONFIGURACION_VER')
  async restoreBackup(@Body() body: { filename: string }) {
    return this.backupService.restoreBackup(body.filename);
  }
}
