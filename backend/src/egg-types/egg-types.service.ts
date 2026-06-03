import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    await this.eggTypeRepository.update(id, updateEggTypeDto);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.eggTypeRepository.delete(id);
  }
}
