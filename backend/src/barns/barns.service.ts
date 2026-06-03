import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { Barn } from './entities/barn.entity';
import { CreateBarnDto } from './dto/create-barn.dto';
import { UpdateBarnDto } from './dto/update-barn.dto';

@Injectable()
export class BarnsService {
  private readonly logger = new Logger(BarnsService.name);

  constructor(
    @InjectRepository(Barn)
    private readonly barnRepository: Repository<Barn>,
  ) {}

  async create(dto: CreateBarnDto) {
    const existing = await this.barnRepository.findOne({
      where: { nombre: ILike(dto.nombre) },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un galpón con el nombre "${dto.nombre}"`);
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
      relations: ['ubicacion_lote', 'asignacion_historial', 'unidadMedida'],
    });

    return {
      message: 'Lista de galpones obtenida',
      data,
    };
  }

  async findOne(id_galpon: string) {
    const barn = await this.barnRepository.findOne({
      where: { id_galpon },
      relations: ['ubicacion_lote', 'asignacion_historial', 'unidadMedida']
    });

    if (!barn) {
      throw new NotFoundException(`Galpón con id ${id_galpon} no encontrado`);
    }

    return {
      message: 'Galpón encontrado',
      data: barn,
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

    await this.barnRepository.remove(barnResult);

    this.logger.warn(`Galpón eliminado: ${id_galpon}`);

    return {
      message: 'Galpón eliminado correctamente',
    };
  }
}
