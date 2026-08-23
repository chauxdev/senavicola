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
import { SupplyHistory } from '../supply-history/entities/supply-history.entity';
import { SupplyAction } from '../supply-actions/entities/supply-action.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private readonly insumoRepository: Repository<Supply>,

    @InjectRepository(SupplyHistory)
    private readonly historyRepository: Repository<SupplyHistory>,

    @InjectRepository(SupplyAction)
    private readonly actionRepository: Repository<SupplyAction>,

    private readonly usersService: UsersService,
  ) {}

  private parseIntegers(supply: Supply): Supply {
    if (supply) {
      if (supply.cantidad !== undefined && supply.cantidad !== null) {
        supply.cantidad = Math.floor(Number(supply.cantidad));
      }
      if (supply.stockMinimo !== undefined && supply.stockMinimo !== null) {
        supply.stockMinimo = Math.floor(Number(supply.stockMinimo));
      }
    }
    return supply;
  }

  async create(dto: CreateSupplyDto, userDisplayName: string = 'Sistema', userObj?: any): Promise<Supply> {
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

    let id_llamar_usuario = dto.id_llamar_usuario;
    if (userObj && userObj.id_usuario && userObj.id_usuario !== 'guest') {
      const callUser = await this.usersService.getLlamarUsuario(userObj.id_usuario);
      id_llamar_usuario = callUser.id_llamar_usuario;
    } else if (!id_llamar_usuario) {
      // Si es invitado o no hay usuario, podríamos asignarlo a un usuario sistema o dejar que falle la BD si no permite nulos.
      // Depende de la lógica del negocio. Usaremos 1 como fallback temporal (admin o sistema).
      id_llamar_usuario = 1;
    }

    const insumo = this.insumoRepository.create({
      ...dto,
      id_llamar_usuario,
      fecha: new Date(dto.fecha),
    });
    const saved = await this.insumoRepository.save(insumo);

    // LOG HISTORIAL: Entrada por creación
    const accion = await this.actionRepository.findOne({ where: { nombre: 'ENTRADA' } });
    if (accion) {
      await this.historyRepository.save(
        this.historyRepository.create({
          insumo: saved,
          accion: accion,
          cantidad: saved.cantidad,
          descripcion: 'Registro inicial de insumo',
          fecha: new Date(),
          usuario: userDisplayName,
        })
      );
    }

    return this.parseIntegers(saved);
  }

  async findAll(paginationDto: PaginationDto): Promise<StandardPaginationResponse<Supply>> {
    const qb = this.insumoRepository.createQueryBuilder('insumo')
      .leftJoinAndSelect('insumo.categoria', 'categoria')
      .leftJoinAndSelect('insumo.unidadMedida', 'unidadMedida')
      .leftJoinAndSelect('insumo.llamarUsuario', 'llamarUsuario')
      .leftJoinAndSelect('llamarUsuario.usuario', 'usuario');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(insumo.nombre ILIKE :search OR categoria.nombre_categoria ILIKE :search)', { search: s });
    }

    const response = await paginateAndRespond(qb, paginationDto);
    response.data = response.data.map((item) => this.parseIntegers(item));
    return response;
  }

  async findOne(id: string): Promise<Supply> {
    const insumo = await this.insumoRepository.findOne({
      where: { id_insumo: id },
      relations: ['categoria', 'unidadMedida', 'llamarUsuario', 'historial'],
    });
    if (!insumo) {
      throw new NotFoundException(`Insumo con ID ${id} no encontrado`);
    }
    return this.parseIntegers(insumo);
  }

  async update(id: string, dto: UpdateSupplyDto, userDisplayName: string = 'Sistema'): Promise<Supply> {
    const insumo = await this.findOne(id);
    const anteriorCantidad = Number(insumo.cantidad);
    
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
    const saved = await this.insumoRepository.save(updated);

    // LOG HISTORIAL: Si cambió la cantidad
    const nuevaCantidad = Number(saved.cantidad);
    if (nuevaCantidad !== anteriorCantidad) {
      const diff = nuevaCantidad - anteriorCantidad;
      const nombreAccion = diff > 0 ? 'ENTRADA' : 'SALIDA';
      const accion = await this.actionRepository.findOne({ where: { nombre: nombreAccion } });
      if (accion) {
        await this.historyRepository.save(
          this.historyRepository.create({
            insumo: saved,
            accion: accion,
            cantidad: Math.abs(diff),
            descripcion: `Actualización de stock de insumo (anterior: ${anteriorCantidad}, nuevo: ${nuevaCantidad})`,
            fecha: new Date(),
            usuario: userDisplayName,
          })
        );
      }
    }

    return this.parseIntegers(saved);
  }

  async ajustarCantidad(id: string, cantidad: string, userDisplayName: string = 'Sistema'): Promise<Supply> {
    const insumo = await this.findOne(id);
    const anteriorCantidad = Number(insumo.cantidad);
    const nuevaCantidad = Number(insumo.cantidad) + Number(cantidad);
    if (nuevaCantidad < 0) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${insumo.cantidad}`,
      );
    }
    insumo.cantidad = nuevaCantidad;
    const saved = await this.insumoRepository.save(insumo);

    // LOG HISTORIAL
    const diff = Number(cantidad);
    if (diff !== 0) {
      const nombreAccion = diff > 0 ? 'ENTRADA' : 'SALIDA';
      const accion = await this.actionRepository.findOne({ where: { nombre: nombreAccion } });
      if (accion) {
        await this.historyRepository.save(
          this.historyRepository.create({
            insumo: saved,
            accion: accion,
            cantidad: Math.abs(diff),
            descripcion: diff > 0 ? 'Ajuste de entrada' : 'Ajuste de salida',
            fecha: new Date(),
            usuario: userDisplayName,
          })
        );
      }
    }

    return this.parseIntegers(saved);
  }

  async reabastecer(id: string, cantidad: number, motivo: string, userDisplayName: string = 'Sistema'): Promise<Supply> {
    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad a reabastecer debe ser mayor a cero');
    }
    const insumo = await this.findOne(id);
    const anterior = Number(insumo.cantidad);
    insumo.cantidad = anterior + cantidad;
    const saved = await this.insumoRepository.save(insumo);

    const accion = await this.actionRepository.findOne({ where: { nombre: 'ENTRADA' } });
    if (accion) {
      await this.historyRepository.save(
        this.historyRepository.create({
          insumo: saved,
          accion: accion,
          cantidad: cantidad,
          descripcion: motivo || 'Reabastecimiento de insumo',
          fecha: new Date(),
          usuario: userDisplayName,
        })
      );
    }
    return this.parseIntegers(saved);
  }

  async remove(id: string): Promise<{ message: string }> {
    const insumo = await this.findOne(id);
    await this.insumoRepository.softRemove(insumo);
    return { message: `Insumo con ID ${id} eliminado correctamente` };
  }
}
