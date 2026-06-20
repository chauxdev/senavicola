import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { EggType } from './entities/egg-type.entity';
import { CreateEggTypeDto } from './dto/create-egg-type.dto';
import { UpdateEggTypeDto } from './dto/update-egg-type.dto';

@Injectable()
export class EggTypesService {
  constructor(
    @InjectRepository(EggType)
    private readonly eggTypeRepository: Repository<EggType>,
  ) {}

  async create(createEggTypeDto: CreateEggTypeDto) {
    const existing = await this.eggTypeRepository.findOne({
      where: { tipo: ILike(createEggTypeDto.tipo) },
    });
    if (existing) {
      throw new ConflictException(`El tipo de huevo "${createEggTypeDto.tipo}" ya existe`);
    }

    const eggType = this.eggTypeRepository.create(createEggTypeDto);
    return await this.eggTypeRepository.save(eggType);
  }

  findAll() {
    return this.eggTypeRepository.find();
  }

  findOne(id: string) {
    return this.eggTypeRepository.findOne({
      where: { id_tipo: id },
    });
  }

  async update(id: string, updateEggTypeDto: UpdateEggTypeDto) {
    const current = await this.eggTypeRepository.findOne({
      where: { id_tipo: id },
    });
    if (!current) {
      throw new NotFoundException(`Tipo de huevo ${id} no encontrado`);
    }

    if (
      updateEggTypeDto.tipo &&
      updateEggTypeDto.tipo.toLowerCase() !== current.tipo.toLowerCase()
    ) {
      const existing = await this.eggTypeRepository.findOne({
        where: { tipo: ILike(updateEggTypeDto.tipo) },
      });
      if (existing) {
        throw new ConflictException(`El tipo de huevo "${updateEggTypeDto.tipo}" ya existe`);
      }
    }

    await this.eggTypeRepository.update(id, updateEggTypeDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.eggTypeRepository.delete(id);
  }
}
