import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { paginateAndRespond } from '../common/utils/pagination.util';

import { EggInventory } from './entities/egg-inventory.entity';
import { EggProduction } from './entities/egg-production.entity';
import { DamagedEgg } from './entities/damaged-egg.entity';
import { EggHistory } from './entities/egg-history.entity';

import { RegisterEggProductionDto } from './dto/register-egg-production.dto';
import { RegisterDamagedEggsDto } from './dto/register-damaged-eggs.dto';
import { UpdateEggInventoryDto } from './dto/update-egg-inventory.dto';
import { EggFilterDto } from './dto/egg-filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class EggInventoryService {
  private readonly logger = new Logger(EggInventoryService.name);

  constructor(
    @InjectRepository(EggInventory)
    private readonly inventoryRepo: Repository<EggInventory>,

    @InjectRepository(EggProduction)
    private readonly productionRepo: Repository<EggProduction>,

    @InjectRepository(DamagedEgg)
    private readonly damagedRepo: Repository<DamagedEgg>,

    @InjectRepository(EggHistory)
    private readonly historyRepo: Repository<EggHistory>,
  ) {}

  async registerProduction(dto: RegisterEggProductionDto) {
    if (dto.fecha) {
      const selectedDate = new Date(dto.fecha);
      if (selectedDate > new Date()) {
        throw new BadRequestException('La fecha de producción no puede ser en el futuro');
      }
    }

    let inventory = await this.inventoryRepo.findOne({
      where: {
        lote: { id_lote: dto.loteId },
        tipo_huevo: { id_tipo: dto.tipoHuevoId }
      }
    });

    const productionData: DeepPartial<EggProduction> = {
      lote: { id_lote: dto.loteId } as any,
      tipo_huevoId: dto.tipoHuevoId,
      cantidady: dto.cantidad,
    };
    if (dto.fecha) productionData.produccionFecha = new Date(dto.fecha);

    const production = this.productionRepo.create(productionData);
    const savedProduction = await this.productionRepo.save(production);

    if (inventory) {
      inventory.cantidad += dto.cantidad;
    } else {
      inventory = this.inventoryRepo.create({
        lote: { id_lote: dto.loteId } as any,
        tipo_huevo: { id_tipo: dto.tipoHuevoId } as any,
        cantidad: dto.cantidad,
        produccion: savedProduction
      });
    }

    const savedInventory = await this.inventoryRepo.save(inventory);
    this.logger.log(`Producción registrada: ${savedProduction.id_produccion_huevo}`);

    return {
      message: 'Producción de huevos registrada correctamente',
      data: savedInventory,
    };
  }

  async registerDamaged(dto: RegisterDamagedEggsDto) {
    const inventory = await this.inventoryRepo.findOne({ where: { id_inventario_huevo: dto.inventarioId } });
    
    if (!inventory) {
      throw new NotFoundException(`Inventario con ID ${dto.inventarioId} no encontrado`);
    }

    if (inventory.cantidad < dto.cantidad) {
      throw new BadRequestException('La cantidad dañada no puede ser mayor al inventario disponible');
    }

    const cantidadAnterior = inventory.cantidad;
    inventory.cantidad -= dto.cantidad;
    await this.inventoryRepo.save(inventory);

    const damaged = this.damagedRepo.create({
      inventario: inventory,
      cantidad: dto.cantidad,
      razon: dto.razon,
    });
    const savedDamaged = await this.damagedRepo.save(damaged);

    // Write egg history entry
    await this.historyRepo.save(
      this.historyRepo.create({
        inventario: inventory,
        cantidad: dto.cantidad,
        cantidadAnterior,
        tipoMovimiento: 'Huevos Dañados',
      })
    );

    this.logger.warn(`Huevos dañados registrados: ${dto.cantidad} unidades`);

    return {
      message: 'Huevos dañados registrados correctamente',
      data: savedDamaged,
    };
  }

  async findAll(paginationDto: EggFilterDto) {
    const qb = this.inventoryRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.tipo_huevo', 'tipo')
      .leftJoinAndSelect('inv.lote', 'lote')
      .leftJoinAndSelect('lote.ubicacion', 'ubicacion')
      .leftJoinAndSelect('ubicacion.galpon', 'galpon')
      .leftJoinAndSelect('inv.produccion', 'produccion')
      .leftJoinAndSelect('inv.damagedEggs', 'damagedEggs');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(tipo.tipo ILIKE :search OR lote.nombre ILIKE :search)', { search: s });
    }

    if (paginationDto.tipo && paginationDto.tipo !== 'todos') {
      qb.andWhere('tipo.tipo = :tipo', { tipo: paginationDto.tipo });
    }

    const paginatedResult = await paginateAndRespond(qb, paginationDto);

    return {
      message: 'Inventario de huevos obtenido',
      ...paginatedResult,
    };
  }

  async findDamaged(paginationDto: EggFilterDto) {
    const qb = this.damagedRepo.createQueryBuilder('damaged')
      .leftJoinAndSelect('damaged.inventario', 'inventario')
      .leftJoinAndSelect('inventario.tipo_huevo', 'tipo')
      .leftJoinAndSelect('inventario.lote', 'lote')
      .orderBy('damaged.registeredAt', 'DESC');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(damaged.razon ILIKE :search OR lote.nombre ILIKE :search)', { search: s });
    }

    if (paginationDto.tipo && paginationDto.tipo !== 'todos') {
      qb.andWhere('tipo.tipo = :tipo', { tipo: paginationDto.tipo });
    }

    const paginatedResult = await paginateAndRespond(qb, paginationDto);

    return {
      message: 'Lista de huevos dañados obtenida',
      ...paginatedResult,
    };
  }

  async findOne(id: string) {
    const inv = await this.inventoryRepo.findOne({
      where: { id_inventario_huevo: id },
      relations: ['tipo_huevo', 'lote', 'produccion', 'damagedEggs', 'history'],
    });

    if (!inv) {
      throw new NotFoundException(`Inventario ${id} no encontrado`);
    }

    return {
      message: `Inventario ${id} encontrado`,
      data: inv,
    };
  }

  async getHistory(paginationDto: PaginationDto) {
    const qb = this.historyRepo.createQueryBuilder('hist')
      .leftJoinAndSelect('hist.inventario', 'inventario')
      .leftJoinAndSelect('inventario.tipo_huevo', 'tipo_huevo')
      .leftJoinAndSelect('inventario.lote', 'lote')
      .orderBy('hist.fecha', 'DESC');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(lote.nombre ILIKE :search OR hist.tipoMovimiento ILIKE :search)', { search: s });
    }

    const paginatedResult = await paginateAndRespond(qb, paginationDto);
    return { message: 'Historial de huevos obtenido', ...paginatedResult };
  }

  async getProductionReport(periodo: 'semanal' | 'mensual' | 'trimestral', paginationDto: PaginationDto) {
    const qb = this.productionRepo.createQueryBuilder('prod')
      .leftJoinAndSelect('prod.lote', 'lote')
      .leftJoinAndSelect('prod.tipo_huevo', 'tipo_huevo');

    const now = new Date();
    let startDate = new Date();

    if (periodo === 'semanal') {
      startDate.setDate(now.getDate() - 7);
    } else if (periodo === 'mensual') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (periodo === 'trimestral') {
      startDate.setMonth(now.getMonth() - 3);
    }

    qb.where('prod.produccionFecha >= :startDate', { startDate });

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('lote.nombre ILIKE :search', { search: s });
    }

    qb.orderBy('prod.produccionFecha', 'DESC');

    const paginatedResult = await paginateAndRespond(qb, paginationDto);

    return {
      message: `Reporte de producción ${periodo} obtenido`,
      ...paginatedResult,
    };
  }

  async update(id: string, dto: UpdateEggInventoryDto) {
    const inv = await this.inventoryRepo.findOne({
      where: { id_inventario_huevo: id },
      relations: ['tipo_huevo', 'lote'],
    });

    if (!inv) {
      throw new NotFoundException(`Registro de inventario ${id} no encontrado`);
    }

    const cantidadAnterior = inv.cantidad;

    if (dto.tipoHuevoId) {
      inv.tipo_huevo = { id_tipo: dto.tipoHuevoId } as any;
    }
    if (dto.loteId) {
      inv.lote = { id_lote: dto.loteId } as any;
    }
    if (dto.cantidad !== undefined) {
      inv.cantidad = dto.cantidad;
    }

    const saved = await this.inventoryRepo.save(inv);

    // Write history entry for quantity changes
    if (dto.cantidad !== undefined && dto.cantidad !== cantidadAnterior) {
      await this.historyRepo.save(
        this.historyRepo.create({
          inventario: saved,
          cantidad: saved.cantidad,
          cantidadAnterior,
          tipoMovimiento: 'Actualización',
        })
      );
    }

    return {
      message: 'Registro de inventario actualizado correctamente',
      data: saved,
    };
  }

  async remove(id: string) {
    const inv = await this.inventoryRepo.findOne({
      where: { id_inventario_huevo: id },
    });

    if (!inv) {
      throw new NotFoundException(`Registro de inventario ${id} no encontrado`);
    }

    await this.inventoryRepo.softRemove(inv);
    return {
      message: 'Registro de inventario eliminado correctamente',
    };
  }
}
