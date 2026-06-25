import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    private readonly dataSource: DataSource,
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

  async generateCsvBuffer(id: string): Promise<{ filename: string; buffer: Buffer }> {
    const report = await this.findOne(id);
    const type = report.data.tipo_reporte;
    let csvContent = '';
    const filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    const BOM = '\uFEFF';

    if (type === 'gallinas') {
      const flocks = await this.dataSource.getRepository('Flock').find({ relations: ['galpon'] });
      csvContent = 'Nombre Lote,Galpón,Cantidad Aves,Estado,Fecha de Inicio\n';
      flocks.forEach((f: any) => {
        csvContent += `"${f.nombre}","${f.galpon?.nombre || 'N/A'}",${f.cantidad_aves},"${f.estado}","${f.fecha_inicio || ''}"\n`;
      });
    } else if (type === 'huevos') {
      const eggs = await this.dataSource.getRepository('EggInventory').find({ relations: ['tipo_huevo', 'lote'] });
      csvContent = 'Tipo Huevo,Cantidad,Lote,Fecha Registro\n';
      eggs.forEach((e: any) => {
        csvContent += `"${e.tipo_huevo?.tipo || 'N/A'}",${e.cantidad},"${e.lote?.nombre || 'N/A'}","${e.fecha_registro || ''}"\n`;
      });
    } else if (type === 'insumos') {
      const supplies = await this.dataSource.getRepository('Supply').find({ relations: ['categoria', 'unidadMedida'] });
      csvContent = 'Insumo,Categoría,Cantidad,Unidad Medida,Fecha Ingreso\n';
      supplies.forEach((s: any) => {
        csvContent += `"${s.nombre}","${s.categoria?.nombre_categoria || 'N/A'}",${s.cantidad},"${s.unidadMedida?.abreviatura || 'N/A'}","${s.fecha || ''}"\n`;
      });
    } else {
      csvContent = `Reporte General,Tipo: ${type},Creado: ${new Date().toISOString()}\n`;
    }

    return {
      filename,
      buffer: Buffer.from(BOM + csvContent, 'utf-8'),
    };
  }
}
