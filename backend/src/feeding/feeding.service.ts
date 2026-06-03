import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feeding } from './entities/feeding.entity';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import { User } from '../users/entities/user.entity';
import { Flock } from '../flocks/entities/flock.entity';
import { Supply } from '../supplies/entities/supply.entity';

@Injectable()
export class FeedingService {
  constructor(
    @InjectRepository(Feeding)
    private readonly feedingRepo: Repository<Feeding>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Flock)
    private readonly flockRepo: Repository<Flock>,

    @InjectRepository(Supply)
    private readonly supplyRepo: Repository<Supply>,
  ) {}

  async create(dto: CreateFeedingDto) {
    const usuario = await this.userRepo.findOneBy({
      id_usuario: dto.id_usuario,
    });
    const lote = await this.flockRepo.findOneBy({ id_lote: dto.id_lote });
    const insumo = await this.supplyRepo.findOneBy({
      id_insumo: dto.id_insumo,
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    if (!lote) throw new NotFoundException('Lote no encontrado');
    if (!insumo) throw new NotFoundException('Insumo no encontrado');

    const alimentacion = this.feedingRepo.create({
      usuario,
      lote,
      insumo,
      cantidad: dto.cantidad,
    });

    return await this.feedingRepo.save(alimentacion);
  }

  findAll() {
    return this.feedingRepo.find({
      relations: ['usuario', 'lote', 'insumo'],
    });
  }

  async findOne(id_alimentacion: string) {
    const data = await this.feedingRepo.findOne({
      where: { id_alimentacion },
      relations: ['usuario', 'lote', 'insumo'],
    });

    if (!data) throw new NotFoundException('Registro no encontrado');

    return data;
  }

  async remove(id: string) {
    const data = await this.findOne(id);
    return this.feedingRepo.remove(data);
  }
}
