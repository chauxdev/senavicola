import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supply } from './entities/supply.entity';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginateAndRespond, StandardPaginationResponse } from '../common/utils/pagination.util';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private readonly insumoRepository: Repository<Supply>,
  ) {}

  async create(dto: CreateSupplyDto): Promise<Supply> {
    const existing = await this.insumoRepository.findOne({
      where: {
        nombre: dto.nombre,
        id_categoria: dto.id_categoria,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un insumo con el nombre "${dto.nombre}" en la categoría seleccionada`,
      );
    }

    const insumo = this.insumoRepository.create({
      ...dto,
      fecha: new Date(dto.fecha),
    });
    return this.insumoRepository.save(insumo);
  }

  async findAll(paginationDto: PaginationDto): Promise<StandardPaginationResponse<Supply>> {
    const qb = this.insumoRepository.createQueryBuilder('insumo')
      .leftJoinAndSelect('insumo.categoria', 'categoria')
      .leftJoinAndSelect('insumo.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('insumo.llamarUsuario', 'llamarUsuario');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(insumo.nombre ILIKE :search OR categoria.nombre_categoria ILIKE :search)', { search: s });
    }

    return paginateAndRespond(qb, paginationDto);
  }

  async findOne(id: string): Promise<Supply> {
    const insumo = await this.insumoRepository.findOne({
      where: { id_insumo: id },
      relations: ['categoria', 'unidadMedida', 'llamarUsuario', 'historial'],
    });
    if (!insumo) {
      throw new NotFoundException(`Insumo con ID ${id} no encontrado`);
    }
    return insumo;
  }

  async update(id: string, dto: UpdateSupplyDto): Promise<Supply> {
    const insumo = await this.findOne(id);
    
    if (dto.nombre || dto.id_categoria) {
      const nombreCheck = dto.nombre || insumo.nombre;
      const categoriaCheck = dto.id_categoria || insumo.id_categoria;
      
      const existing = await this.insumoRepository.findOne({
        where: {
          nombre: nombreCheck,
          id_categoria: categoriaCheck,
        },
      });

      if (existing && existing.id_insumo !== id) {
        throw new ConflictException(
          `Ya existe un insumo con el nombre "${nombreCheck}" en la categoría seleccionada`,
        );
      }
    }

    const updated = Object.assign(insumo, {
      ...dto,
      ...(dto.fecha && { fecha: new Date(dto.fecha) }),
    });
    return this.insumoRepository.save(updated);
  }

  async ajustarCantidad(id: string, cantidad: string): Promise<Supply> {
    const insumo = await this.findOne(id);
    const nuevaCantidad = Number(insumo.cantidad) + Number(cantidad);
    if (nuevaCantidad < 0) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${insumo.cantidad}`,
      );
    }
    insumo.cantidad = nuevaCantidad;
    return this.insumoRepository.save(insumo);
  }

  async remove(id: string): Promise<{ message: string }> {
    const insumo = await this.findOne(id);
    await this.insumoRepository.remove(insumo);
    return { message: `Insumo con ID ${id} eliminado correctamente` };
  }
}
