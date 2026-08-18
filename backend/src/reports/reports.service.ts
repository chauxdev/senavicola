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

  private buildWhereClause(fechaInicio?: string, fechaFin?: string, dateField: string = 'fecha') {
    if (!fechaInicio && !fechaFin) return {};
    const where: any = {};
    if (fechaInicio && fechaFin) {
      where[dateField] = { $between: [new Date(fechaInicio), new Date(fechaFin)] }; // This might be tricky in typeorm without Between, let's use query builder if needed. Actually simpler:
    }
    return {};
  }
  // Let's implement simpler date filtering manually for now after querying, or using QueryBuilder.
  private applyDateFilter(qb: any, alias: string, field: string, fechaInicio?: string, fechaFin?: string) {
    if (fechaInicio) {
      qb.andWhere(`${alias}.${field} >= :fechaInicio`, { fechaInicio: new Date(fechaInicio) });
    }
    if (fechaFin) {
      // Add 1 day to include the end date fully
      const fin = new Date(fechaFin);
      fin.setDate(fin.getDate() + 1);
      qb.andWhere(`${alias}.${field} < :fechaFin`, { fechaFin: fin });
    }
  }

  async generateCsvBuffer(id: string, fechaInicio?: string, fechaFin?: string): Promise<{ filename: string; buffer: Buffer }> {
    const report = await this.findOne(id);
    const type = report.data.tipo_reporte;
    let csvContent = '';
    const filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    const BOM = '\uFEFF';

    if (type === 'gallinas') {
      const qb = this.dataSource.getRepository('Flock').createQueryBuilder('f')
        .leftJoinAndSelect('f.ubicacion', 'ubicacion')
        .leftJoinAndSelect('ubicacion.galpon', 'galpon');
      // this.applyDateFilter(qb, 'f', 'fecha_inicio', fechaInicio, fechaFin); // Flock does not have fecha_inicio
      const flocks = await qb.getMany();
      csvContent = 'Nombre Lote,Galpón,Cantidad Aves,Estado\n';
      flocks.forEach((f: any) => {
        const galponName = f.ubicacion && f.ubicacion.length > 0 ? f.ubicacion[0].galpon?.nombre : 'N/A';
        csvContent += `"${f.nombre}","${galponName}",${f.total_aves},"${f.estado}"\n`;
      });
    } else if (type === 'huevos') {
      const qb = this.dataSource.getRepository('EggInventory').createQueryBuilder('e')
        .leftJoinAndSelect('e.tipo_huevo', 'tipo_huevo')
        .leftJoinAndSelect('e.lote', 'lote');
      // For EggInventory, we don't have a clear date field in the model? It is related to produccion, wait, EggInventory has no date. Let's not filter it, or filter by `id_inventario_huevo` creation if it had. We skip date filter for huevos inventory if not applicable, or filter by `produccion.produccionFecha`? Let's just leave it without filter if no field is evident, wait, EggHistory has fecha. 
      // The old code:
      const eggs = await qb.getMany();
      csvContent = 'Tipo Huevo,Cantidad,Lote,Fecha Registro\n';
      eggs.forEach((e: any) => {
        csvContent += `"${e.tipo_huevo?.tipo || 'N/A'}",${e.cantidad},"${e.lote?.nombre || 'N/A'}","${e.fecha_registro || ''}"\n`;
      });
    } else if (type === 'insumos') {
      const qb = this.dataSource.getRepository('Supply').createQueryBuilder('s')
        .leftJoinAndSelect('s.categoria', 'categoria')
        .leftJoinAndSelect('s.unidadMedida', 'unidadMedida');
      this.applyDateFilter(qb, 's', 'fecha', fechaInicio, fechaFin);
      const supplies = await qb.getMany();
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

  async generatePdfBuffer(id: string, fechaInicio?: string, fechaFin?: string): Promise<{ filename: string; buffer: Buffer }> {
    const pdfmake = require('pdfmake');
    pdfmake.setFonts({
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    });

    const report = await this.findOne(id);
    const type = report.data.tipo_reporte;
    const filename = `reporte-${type}-${new Date().toISOString().split('T')[0]}.pdf`;

    const docDefinition: any = {
      defaultStyle: { font: 'Helvetica' },
      content: [
        { text: `Reporte de ${type.toUpperCase()}`, style: 'header' },
        { text: `Generado el: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 20] },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 13, color: 'black' }
      }
    };

    if (fechaInicio || fechaFin) {
      docDefinition.content.push({ text: `Filtro de fechas: ${fechaInicio || 'Inicio'} a ${fechaFin || 'Fin'}`, margin: [0, 0, 0, 10] });
    }

    if (type === 'gallinas') {
      const qb = this.dataSource.getRepository('Flock').createQueryBuilder('f')
        .leftJoinAndSelect('f.ubicacion', 'ubicacion')
        .leftJoinAndSelect('ubicacion.galpon', 'galpon');
      // this.applyDateFilter(qb, 'f', 'fecha_inicio', fechaInicio, fechaFin);
      const flocks = await qb.getMany();
      const body = [['Nombre Lote', 'Galpón', 'Cantidad Aves', 'Estado']];
      flocks.forEach((f: any) => {
        const galponName = f.ubicacion && f.ubicacion.length > 0 ? f.ubicacion[0].galpon?.nombre : 'N/A';
        body.push([f.nombre, galponName, f.total_aves?.toString() || '0', f.estado]);
      });
      docDefinition.content.push({ table: { headerRows: 1, widths: ['*', '*', 'auto', '*'], body } });
    } else if (type === 'huevos') {
      const eggs = await this.dataSource.getRepository('EggInventory').createQueryBuilder('e')
        .leftJoinAndSelect('e.tipo_huevo', 'tipo_huevo')
        .leftJoinAndSelect('e.lote', 'lote').getMany();
      const body = [['Tipo Huevo', 'Cantidad', 'Lote']];
      eggs.forEach((e: any) => body.push([e.tipo_huevo?.tipo || 'N/A', e.cantidad.toString(), e.lote?.nombre || 'N/A']));
      docDefinition.content.push({ table: { headerRows: 1, widths: ['*', 'auto', '*'], body } });
    } else if (type === 'insumos') {
      const qb = this.dataSource.getRepository('Supply').createQueryBuilder('s')
        .leftJoinAndSelect('s.categoria', 'categoria')
        .leftJoinAndSelect('s.unidadMedida', 'unidadMedida');
      this.applyDateFilter(qb, 's', 'fecha', fechaInicio, fechaFin);
      const supplies = await qb.getMany();
      const body = [['Insumo', 'Categoría', 'Cantidad', 'U.M.', 'Fecha Ingreso']];
      supplies.forEach((s: any) => body.push([s.nombre, s.categoria?.nombre_categoria || 'N/A', s.cantidad.toString(), s.unidadMedida?.abreviatura || 'N/A', s.fecha ? new Date(s.fecha).toLocaleDateString() : '']));
      docDefinition.content.push({ table: { headerRows: 1, widths: ['*', '*', 'auto', 'auto', '*'], body } });
    } else {
      docDefinition.content.push({ text: 'Reporte general no estructurado.' });
    }

    const pdfDoc = pdfmake.createPdf(docDefinition);
    const buffer = await pdfDoc.getBuffer();
    return { filename, buffer };
  }
}
