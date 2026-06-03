import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {}

  async create(dto: CreateReportDto) {
    const report = this.reportRepo.create({
      tipo_reporte: dto.tipo_reporte,
      usuario: { id_usuario: dto.id_usuario }, // 🔥 relación
    });

    const saved = await this.reportRepo.save(report);

    this.logger.log(`Reporte creado: ${saved.id_reporte}`);

    return {
      message: 'Reporte creado correctamente',
      data: saved,
    };
  }

  async findAll() {
    const data = await this.reportRepo.find({
      relations: ['usuario'],
    });

    return {
      message: 'Lista de reportes obtenida',
      data,
    };
  }

  async findOne(id_reporte: string) {
    const report = await this.reportRepo.findOne({
      where: { id_reporte },
      relations: ['usuario'],
    });

    if (!report) {
      throw new NotFoundException(`Reporte con id ${id_reporte} no encontrado`);
    }

    return {
      message: 'Reporte encontrado',
      data: report,
    };
  }
}
