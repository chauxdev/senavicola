import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SupplyHistory } from './entities/supply-history.entity';
import { CreateSupplyHistoryDto } from './dto/create-supply-history.dto';
import { UpdateSupplyHistoryDto } from './dto/update-supply-history.dto';
import { Supply } from '../supplies/entities/supply.entity';
import { SupplyAction } from '../supply-actions/entities/supply-action.entity';

// Acciones que reducen stock (por nombre)
const ACCIONES_SALIDA = ['SALIDA', 'CONSUMO', 'BAJA', 'MERMA'];

@Injectable()
export class SupplyHistoryService {
  constructor(
    @InjectRepository(SupplyHistory)
    private readonly historyRepository: Repository<SupplyHistory>,

    @InjectRepository(Supply)
    private readonly insumoRepository: Repository<Supply>,

    @InjectRepository(SupplyAction)
    private readonly actionRepository: Repository<SupplyAction>,

    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSupplyHistoryDto): Promise<SupplyHistory> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Buscar insumo (UUID correcto)
      const insumo = await manager.findOne(Supply, {
        where: { id_insumo: dto.id_insumos },
      });

      if (!insumo) {
        throw new NotFoundException(
          `Insumo con ID ${dto.id_insumos} no encontrado`,
        );
      }

      // Buscar acción
      const accion = await manager.findOne(SupplyAction, {
        where: { id_accion_historial_movimiento: dto.id_historial_accion },
      });

      if (!accion) {
        throw new NotFoundException(
          `Acción con ID ${dto.id_historial_accion} no encontrada`,
        );
      }

      // 3. Validar si es salida
      const accionSalida = ACCIONES_SALIDA.includes(
        accion.nombre.toUpperCase(),
      );

      // 4. Calcular nueva cantidad
      const nuevaCantidad = accionSalida
        ? Number(insumo.cantidad) - Number(dto.cantidad)
        : Number(insumo.cantidad) + Number(dto.cantidad);

      if (nuevaCantidad < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${insumo.cantidad}, solicitado: ${dto.cantidad}`,
        );
      }

      // 5. Actualizar stock
      insumo.cantidad = nuevaCantidad;
      await manager.save(insumo);

      // 6. Guardar historial
      const historial = manager.create(SupplyHistory, {
        cantidad: dto.cantidad,
        descripcion: dto.descripcion,
        fecha: new Date(dto.fecha),
        insumo: insumo,
        accion: accion,
      });

      return manager.save(SupplyHistory, historial);
    });
  }

  async findAll(): Promise<SupplyHistory[]> {
    return this.historyRepository.find({
      relations: ['insumo', 'accion'],
      order: { fecha: 'DESC' },
    });
  }

  async findByInsumo(idInsumo: string): Promise<SupplyHistory[]> {
    return this.historyRepository.find({
      where: {
        insumo: { id_insumo: idInsumo },
      },
      relations: ['insumo', 'accion'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SupplyHistory> {
    const history = await this.historyRepository.findOne({
      where: { id_historial_insumo: id },
      relations: ['insumo', 'accion'],
    });

    if (!history) {
      throw new NotFoundException(`Historial con ID ${id} no encontrado`);
    }

    return history;
  }

  async update(
    id: string,
    dto: UpdateSupplyHistoryDto,
  ): Promise<SupplyHistory> {
    const history = await this.findOne(id);

    const updated = Object.assign(history, {
      ...dto,
      ...(dto.fecha && { fecha: new Date(dto.fecha) }),
    });

    return this.historyRepository.save(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const history = await this.findOne(id);
    await this.historyRepository.remove(history);

    return { message: `Historial con ID ${id} eliminado correctamente` };
  }
}
