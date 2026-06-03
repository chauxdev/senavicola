import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplyCategory } from './entities/supply-category.entity';
import { CreateSupplyCategoryDto } from './dto/create-supply-category.dto';
import { UpdateSupplyCategoryDto } from './dto/update-supply-category.dto';

@Injectable()
export class SupplyCategoriesService {
  constructor(
    @InjectRepository(SupplyCategory)
    private readonly supplyCategoryRepository: Repository<SupplyCategory>,
  ) {}

  async create(dto: CreateSupplyCategoryDto): Promise<SupplyCategory> {
    const existing = await this.supplyCategoryRepository.findOne({
      where: { nombre_categoria: dto.nombre_categoria },
    });
    if (existing) {
      throw new ConflictException(
        `La categoría "${dto.nombre_categoria}" ya existe`,
      );
    }
    const category = this.supplyCategoryRepository.create(dto);
    return this.supplyCategoryRepository.save(category);
  }

  async findAll(): Promise<SupplyCategory[]> {
    return this.supplyCategoryRepository.find({ relations: ['insumos'] });
  }

  async findOne(id: string): Promise<SupplyCategory> {
    const category = await this.supplyCategoryRepository.findOne({
      where: { id_categoria_insumo: id },
      relations: ['insumos'],
    });
    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return category;
  }

  async update(
    id: string,
    dto: UpdateSupplyCategoryDto,
  ): Promise<SupplyCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.supplyCategoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.findOne(id);
    await this.supplyCategoryRepository.remove(category);
    return { message: `Categoría con ID ${id} eliminada correctamente` };
  }
}
