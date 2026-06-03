import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplyAction } from './entities/supply-action.entity';
import { CreateSupplyActionDto } from './dto/create-supply-action.dto';
import { UpdateSupplyActionDto } from './dto/update-supply-action.dto';

@Injectable()
export class SupplyActionsService {
  constructor(
    @InjectRepository(SupplyAction)
    private readonly supplyActionRepository: Repository<SupplyAction>,
  ) {}

  async create(dto: CreateSupplyActionDto): Promise<SupplyAction> {
    const existing = await this.supplyActionRepository.findOne({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException(`La acción "${dto.nombre}" ya existe`);
    }
    const action = this.supplyActionRepository.create(dto);
    return this.supplyActionRepository.save(action);
  }

  async findAll(): Promise<SupplyAction[]> {
    return this.supplyActionRepository.find();
  }

  async findOne(id_accion_historial_movimiento: string): Promise<SupplyAction> {
    const action = await this.supplyActionRepository.findOne({
      where: { id_accion_historial_movimiento: id_accion_historial_movimiento },
    });
    if (!action) {
      throw new NotFoundException(
        `Acción con ID ${id_accion_historial_movimiento} no encontrada`,
      );
    }
    return action;
  }

  async update(id: string, dto: UpdateSupplyActionDto): Promise<SupplyAction> {
    const action = await this.findOne(id);

    if (dto.nombre) {
      const existing = await this.supplyActionRepository.findOne({
        where: { nombre: dto.nombre },
      });

      if (existing && existing.id_accion_historial_movimiento !== id) {
        throw new ConflictException(`La acción "${dto.nombre}" ya existe`);
      }
    }

    Object.assign(action, dto);
    return this.supplyActionRepository.save(action);
  }

  async remove(id: string): Promise<{ message: string }> {
    const action = await this.findOne(id);
    await this.supplyActionRepository.remove(action);
    return { message: `Acción con ID ${id} eliminada correctamente` };
  }
}
