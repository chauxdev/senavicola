import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';

import { Breed } from './entities/breed.entity';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';

@Injectable()
export class BreedsService {
  private readonly logger = new Logger(BreedsService.name);

  constructor(
    @InjectRepository(Breed)
    private readonly breedRepository: Repository<Breed>,
  ) {}

  async create(dto: CreateBreedDto) {
    const existing = await this.breedRepository.findOne({
      where: { nombre: ILike(dto.nombre) },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una raza con el nombre "${dto.nombre}"`);
    }

    const breed = this.breedRepository.create(dto);
    const saved = await this.breedRepository.save(breed);

    this.logger.log(`Raza creada: ${saved.id_raza}`);

    return {
      message: 'Raza creada correctamente',
      data: saved,
    };
  }

  async findAll() {
    const data = await this.breedRepository.find();

    return {
      message: 'Lista de razas obtenida',
      data,
    };
  }

  async findOne(id_raza: string) {
    const breed = await this.breedRepository.findOneBy({ id_raza });

    if (!breed) {
      throw new NotFoundException(`Raza con id ${id_raza} no encontrada`);
    }

    return {
      message: 'Raza encontrada',
      data: breed,
    };
  }

  async update(id_raza: string, dto: UpdateBreedDto) {
    const breed = await this.breedRepository.findOneBy({ id_raza });

    if (!breed) {
      throw new NotFoundException(`Raza con id ${id_raza} no encontrada`);
    }

    if (dto.nombre && dto.nombre.toLowerCase() !== breed.nombre.toLowerCase()) {
      const existing = await this.breedRepository.findOne({
        where: { nombre: ILike(dto.nombre) },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una raza con el nombre "${dto.nombre}"`);
      }
    }

    Object.assign(breed, dto);

    const updated = await this.breedRepository.save(breed);

    this.logger.log(`Raza actualizada: ${id_raza}`);

    return {
      message: 'Raza actualizada correctamente',
      data: updated,
    };
  }

  async remove(id_raza: string) {
    const breed = await this.breedRepository.findOneBy({ id_raza });

    if (!breed) {
      throw new NotFoundException(`Raza con id ${id_raza} no encontrada`);
    }

    await this.breedRepository.remove(breed);

    this.logger.warn(`Raza eliminada: ${id_raza}`);

    return {
      message: 'Raza eliminada correctamente',
    };
  }
}
