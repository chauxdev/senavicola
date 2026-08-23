import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { Barn } from './entities/barn.entity';
import { CreateBarnDto } from './dto/create-barn.dto';
import { UpdateBarnDto } from './dto/update-barn.dto';
import { FlockLocation } from '../flocks/entities/flock-location.entity';

@Injectable()
export class BarnsService {
  private readonly logger = new Logger(BarnsService.name);

  constructor(
    @InjectRepository(Barn)
    private readonly barnRepository: Repository<Barn>,
    @InjectRepository(FlockLocation)
    private readonly locationRepository: Repository<FlockLocation>,
  ) {}

  async create(dto: CreateBarnDto) {
    const existing = await this.barnRepository.findOne({
      where: { nombre: ILike(dto.nombre) },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un galpón con el nombre "${dto.nombre}"`);
    }

    const existingCodigo = await this.barnRepository.findOne({
      where: { codigo: dto.codigo },
    });
    if (existingCodigo) {
      throw new ConflictException(`Ya existe un galpón con el código "${dto.codigo}"`);
    }

    const { id_unidad_medida, ...rest } = dto;
    const barn = this.barnRepository.create({
      ...rest,
      unidadMedida: id_unidad_medida ? { id_unidad_medida } as any : undefined,
    });
    const saved = await this.barnRepository.save(barn);

    this.logger.log(`Galpón creado: ${saved.codigo}`);

    return {
      message: 'Galpón creado correctamente',
      data: saved,
    };
  }

  async findAll() {
    const data = await this.barnRepository.find({
      relations: ['ubicacion_lote', 'ubicacion_lote.lote', 'asignacion_historial', 'unidadMedida'],
    });

    const enrichedData = data.map(barn => {
      let currentOccupancy = 0;
      const seen = new Set();
      barn.ubicacion_lote?.forEach(loc => {
        if (loc.lote && (loc.lote.estado === 'ACTIVO' || loc.lote.estado === 'activo')) {
          if (!seen.has(loc.lote.id_lote)) {
            seen.add(loc.lote.id_lote);
            currentOccupancy += Number(loc.lote.total_aves) || 0;
          }
        }
      });
      return { ...barn, total_aves_actuales: currentOccupancy };
    });

    return {
      message: 'Lista de galpones obtenida',
      data: enrichedData,
    };
  }

  async findOne(id_galpon: string) {
    const barn = await this.barnRepository.findOne({
      where: { id_galpon },
      relations: ['ubicacion_lote', 'ubicacion_lote.lote', 'ubicacion_lote.lote.raza', 'asignacion_historial', 'unidadMedida']
    });

    if (!barn) {
      throw new NotFoundException(`Galpón con id ${id_galpon} no encontrado`);
    }

    let currentOccupancy = 0;
    const seen = new Set();
    barn.ubicacion_lote?.forEach(loc => {
      if (loc.lote && (loc.lote.estado === 'ACTIVO' || loc.lote.estado === 'activo')) {
        if (!seen.has(loc.lote.id_lote)) {
          seen.add(loc.lote.id_lote);
          currentOccupancy += Number(loc.lote.total_aves) || 0;
        }
      }
    });

    return {
      message: 'Galpón encontrado',
      data: { ...barn, total_aves_actuales: currentOccupancy },
    };
  }  async update(id_galpon: string, dto: UpdateBarnDto) {
    const barnResult = await this.barnRepository.findOne({
      where: { id_galpon },
      relations: ['unidadMedida'],
    });

    if (!barnResult) {
      throw new NotFoundException(`Galpón con id ${id_galpon} no encontrado`);
    }

    if (dto.nombre && dto.nombre.toLowerCase() !== barnResult.nombre.toLowerCase()) {
      const existing = await this.barnRepository.findOne({
        where: { nombre: ILike(dto.nombre) },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un galpón con el nombre "${dto.nombre}"`);
      }
    }

    if (dto.codigo && dto.codigo !== barnResult.codigo) {
      const existingCodigo = await this.barnRepository.findOne({
        where: { codigo: dto.codigo },
      });
      if (existingCodigo) {
        throw new ConflictException(`Ya existe un galpón con el código "${dto.codigo}"`);
      }
    }

    if (dto.capacidad_max_aves !== undefined && dto.capacidad_max_aves !== barnResult.capacidad_max_aves) {
      const qb = this.locationRepository.createQueryBuilder('loc')
        .innerJoin('loc.lote', 'lote')
        .where('loc.galpon.id_galpon = :id_galpon', { id_galpon })
        .andWhere('lote.estado = :estado', { estado: 'ACTIVO' });
      const rows = await qb.select(['lote.id_lote AS id_lote', 'lote.total_aves AS total_aves']).getRawMany();
      let currentOccupancy = 0;
      const seen = new Set();
      for (const row of rows) {
        if (!seen.has(row.id_lote)) {
          seen.add(row.id_lote);
          currentOccupancy += Number(row.total_aves) || 0;
        }
      }

      if (dto.capacidad_max_aves < currentOccupancy) {
        throw new BadRequestException(
          `No se puede reducir la capacidad del galpón porque actualmente tiene ${currentOccupancy} aves asignadas. La capacidad mínima permitida es ${currentOccupancy}.`
        );
      }
    }

    const { id_unidad_medida, ...rest } = dto;
    this.barnRepository.merge(barnResult, rest);

    if (id_unidad_medida !== undefined) {
      barnResult.unidadMedida = id_unidad_medida ? { id_unidad_medida } as any : null;
    }

    const updated = await this.barnRepository.save(barnResult);

    this.logger.log(`Galpón actualizado: ${id_galpon}`);

    return {
      message: 'Galpón actualizado correctamente',
      data: updated,
    };
  }
  async remove(id_galpon: string) {
    const barnResult = await this.barnRepository.findOneBy({ id_galpon });

    if (!barnResult) {
      throw new NotFoundException(`Galpón con id ${id_galpon} no encontrado`);
    }

    // Check for active flocks before deletion
    const activeFlocks = await this.locationRepository
      .createQueryBuilder('loc')
      .innerJoin('loc.lote', 'lote')
      .where('loc.galpon.id_galpon = :id_galpon', { id_galpon })
      .andWhere('lote.estado = :estado', { estado: 'ACTIVO' })
      .getCount();

    if (activeFlocks > 0) {
      throw new BadRequestException(
        `El galpón no puede eliminarse porque tiene ${activeFlocks} lote(s) activo(s) asignado(s). ` +
        `Finalice o reasigne los lotes antes de eliminar el galpón.`
      );
    }

    await this.barnRepository.remove(barnResult);

    this.logger.warn(`Galpón eliminado: ${id_galpon}`);

    return {
      message: 'Galpón eliminado correctamente',
    };
  }
}
