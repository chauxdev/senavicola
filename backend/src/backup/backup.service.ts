import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private backupDir: string;

  constructor(private configService: ConfigService) {
    this.backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<{ message: string; data: { filename: string; path: string; createdAt: Date } }> {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT');
    const database = this.configService.get<string>('DB_NAME');
    const username = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${database}_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    const env = { ...process.env, PGPASSWORD: password };

    try {
      await execAsync(
        `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filePath}"`,
        { env },
      );

      return {
        message: 'Backup creado exitosamente',
        data: {
          filename,
          path: filePath,
          createdAt: new Date(),
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al crear backup: ${errorMessage}`);
    }
  }

  async restoreBackup(filename: string): Promise<{ message: string }> {
    const host = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('DB_PORT');
    const database = this.configService.get<string>('DB_NAME');
    const username = this.configService.get<string>('DB_USERNAME');
    const password = this.configService.get<string>('DB_PASSWORD');

    const filePath = path.join(this.backupDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Archivo de backup no encontrado: ${filename}`);
    }

    const env = { ...process.env, PGPASSWORD: password };

    try {
      await execAsync(
        `psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${filePath}"`,
        { env },
      );

      return { message: 'Backup restaurado exitosamente' };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al restaurar backup: ${errorMessage}`);
    }
  }

  async listBackups(): Promise<{ message: string; data: Array<{ filename: string; size: number; createdAt: Date }> }> {
    const files = fs.readdirSync(this.backupDir)
      .filter(f => f.endsWith('.sql'))
      .map(filename => {
        const stats = fs.statSync(path.join(this.backupDir, filename));
        return {
          filename,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return {
      message: 'Lista de backups',
      data: files,
    };
  }
}
