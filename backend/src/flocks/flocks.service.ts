import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { paginateAndRespond } from '../common/utils/pagination.util';

import { Flock } from './entities/flock.entity';
import { FlockLocation } from './entities/flock-location.entity';
import { FlockAssignmentHistory } from './entities/flock-assignment-history.entity';
import { DeadBird } from './entities/dead-bird.entity';
import { FinishedFlock } from './entities/finished-flock.entity';
import { Breed } from '../breeds/entities/breed.entity';
import { Barn } from '../barns/entities/barn.entity';

import { CreateFlockDto } from './dto/create-flock.dto';
import { UpdateFlockDto } from './dto/update-flock.dto';
import { AssignFlockDto } from './dto/assign-flock.dto';
import { RegisterDeadBirdsDto } from './dto/register-dead-birds.dto';
import { FinishFlockDto } from './dto/finish-flock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class FlocksService {
  private readonly logger = new Logger(FlocksService.name);

  constructor(
    @InjectRepository(Flock)
    private readonly flockRepo: Repository<Flock>,

    @InjectRepository(FlockLocation)
    private readonly locationRepo: Repository<FlockLocation>,

    @InjectRepository(FlockAssignmentHistory)
    private readonly historyRepo: Repository<FlockAssignmentHistory>,

    @InjectRepository(DeadBird)
    private readonly deadBirdRepo: Repository<DeadBird>,

    @InjectRepository(FinishedFlock)
    private readonly finishedFlockRepo: Repository<FinishedFlock>,

    @InjectRepository(Breed)
    private readonly breedRepo: Repository<Breed>,

    @InjectRepository(Barn)
    private readonly barnRepo: Repository<Barn>,
  ) {}

  /** Returns the total number of birds currently assigned to a barn (only ACTIVE flocks). */
  private async getBarnOccupancy(galponId: string, excludeFlockId?: string): Promise<number> {
    const qb = this.locationRepo.createQueryBuilder('loc')
      .innerJoin('loc.lote', 'lote')
      .innerJoin('loc.galpon', 'galpon')
      .where('galpon.id_galpon = :galponId', { galponId })
      .andWhere('lote.estado = :estado', { estado: 'ACTIVO' });

    // When editing a flock we exclude it from the count so we don't double-count it
    if (excludeFlockId) {
      qb.andWhere('lote.id_lote != :excludeFlockId', { excludeFlockId });
    }

    // Join ubicacion_lote only once per flock (take the latest location per lote)
    const rows = await qb.select(['lote.id_lote AS id_lote', 'lote.total_aves AS total_aves']).getRawMany();

    // Deduplicate by flock id (a flock may have multiple location rows)
    const seen = new Set<string>();
    let total = 0;
    for (const row of rows) {
      if (!seen.has(row.id_lote)) {
        seen.add(row.id_lote);
        total += Number(row.total_aves) || 0;
      }
    }
    return total;
  }

  async create(dto: CreateFlockDto, userDisplayName?: string) {
    const existing = await this.flockRepo.findOne({
      where: { nombre: ILike(dto.nombre) },
    });
    if (existing) {
      throw new ConflictException(`Ya existe un lote con el nombre "${dto.nombre}"`);
    }

    const raza = await this.breedRepo.findOneBy({ id_raza: dto.razaId });
    if (!raza) throw new NotFoundException('Raza no encontrada');

    const galpon = await this.barnRepo.findOneBy({ id_galpon: dto.galponId });
    if (!galpon) throw new NotFoundException('Galpón no encontrado');

    // ── Barn capacity validation ──────────────────────────────────────────────
    const currentOccupancy = await this.getBarnOccupancy(dto.galponId);
    const projectedTotal = currentOccupancy + dto.total_aves;
    if (projectedTotal > galpon.capacidad_max_aves) {
      const available = galpon.capacidad_max_aves - currentOccupancy;
      throw new BadRequestException(
        `El galpón "${galpon.nombre}" no tiene suficiente capacidad. ` +
        `Capacidad máxima: ${galpon.capacidad_max_aves} aves. ` +
        `Ocupación actual: ${currentOccupancy} aves. ` +
        `Disponible: ${available > 0 ? available : 0} aves. ` +
        `Solicitado: ${dto.total_aves} aves.`
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const flock = this.flockRepo.create({
      nombre: dto.nombre,
      total_aves: dto.total_aves,
      observacion: dto.observacion,
      racion_alimento: dto.racion_alimento,
      estado: 'ACTIVO',
      raza,
    });

    const saved = await this.flockRepo.save(flock);

    // Register initial location
    const location = this.locationRepo.create({
      lote: saved,
      galpon,
    });
    await this.locationRepo.save(location);

    // Register initial assignment history
    const history = this.historyRepo.create({
      lote: saved,
      galpon,
      cantidad_asignada: dto.total_aves,
      descripcion: 'Crear lote',
      usuario: userDisplayName || 'Sistema',
      nombre_elemento: saved.nombre,
      raza_nombre: raza.nombre,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Lote creado: ${saved.id_lote} y asignado a galpón: ${galpon.id_galpon}`);

    return {
      message: 'Lote creado y asignado al galpón correctamente',
      data: saved,
    };
  }

  async findAll(paginationDto: PaginationDto) {
    const qb = this.flockRepo.createQueryBuilder('flock')
      .leftJoinAndSelect('flock.raza', 'raza')
      .leftJoinAndSelect('flock.ubicacion', 'ubicacion')
      .leftJoinAndSelect('ubicacion.galpon', 'galpon')
      .leftJoinAndSelect('flock.estados', 'estados');

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere('(flock.nombre ILIKE :search OR raza.nombre ILIKE :search)', { search: s });
    }

    const paginatedResult = await paginateAndRespond(qb, paginationDto);

    return {
      message: 'Lista de lotes obtenida',
      ...paginatedResult,
    };
  }

  async findAllHistory(paginationDto: PaginationDto & { loteId?: string }) {
    const qb = this.historyRepo.createQueryBuilder('history')
      .leftJoinAndSelect('history.lote', 'lote')
      .leftJoinAndSelect('history.galpon', 'galpon')
      .orderBy('history.fecha', 'DESC');

    if (paginationDto.loteId) {
      qb.andWhere('history.lote.id_lote = :loteId', { loteId: paginationDto.loteId });
    }

    if (paginationDto.search) {
      const s = `%${paginationDto.search}%`;
      qb.andWhere(
        '(history.descripcion ILIKE :search OR history.usuario ILIKE :search OR history.nombre_elemento ILIKE :search OR history.raza_nombre ILIKE :search)',
        { search: s },
      );
    }

    const paginatedResult = await paginateAndRespond(qb, paginationDto);

    return {
      message: 'Historial de asignaciones obtenido',
      ...paginatedResult,
    };
  }

  async findOne(id: string) {
    const flock = await this.flockRepo.findOne({
      where: { id_lote: id },
      relations: ['raza', 'ubicacion', 'ubicacion.galpon', 'estados'],
    });

    if (!flock) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }

    return {
      message: `Lote ${id} encontrado`,
      data: flock,
    };
  }

  async update(id: string, dto: UpdateFlockDto, userDisplayName?: string) {
    const flock = await this.flockRepo.findOne({
      where: { id_lote: id },
      relations: ['raza', 'ubicacion', 'ubicacion.galpon'],
    });

    if (!flock) {
      throw new NotFoundException(`Lote ${id} no encontrado`);
    }

    if (dto.nombre && dto.nombre.toLowerCase() !== flock.nombre.toLowerCase()) {
      const existing = await this.flockRepo.findOne({
        where: { nombre: ILike(dto.nombre) },
      });
      if (existing && existing.id_lote !== id) {
        throw new ConflictException(`Ya existe un lote con el nombre "${dto.nombre}"`);
      }
    }

    // ── Barn capacity validation on edit ───────
    const targetGalponId = dto.galponId || flock.ubicacion?.[0]?.galpon?.id_galpon;
    const targetAves = dto.total_aves !== undefined ? dto.total_aves : flock.total_aves;

    if (targetGalponId) {
      const isChangingBarn = dto.galponId && dto.galponId !== flock.ubicacion?.[0]?.galpon?.id_galpon;
      const isChangingAves = dto.total_aves !== undefined && dto.total_aves !== flock.total_aves;

      if (isChangingBarn || isChangingAves) {
        const galpon = await this.barnRepo.findOneBy({ id_galpon: targetGalponId });
        if (galpon) {
          const occupancyWithoutThisFlock = await this.getBarnOccupancy(targetGalponId, id);
          const projectedTotal = occupancyWithoutThisFlock + targetAves;
          if (projectedTotal > galpon.capacidad_max_aves) {
            const available = galpon.capacidad_max_aves - occupancyWithoutThisFlock;
            throw new BadRequestException(
              `El galpón "${galpon.nombre}" no tiene suficiente capacidad. ` +
              `Capacidad máxima: ${galpon.capacidad_max_aves} aves. ` +
              `Ocupado por otros lotes: ${occupancyWithoutThisFlock} aves. ` +
              `Disponible: ${available > 0 ? available : 0} aves. ` +
              `Solicitado: ${targetAves} aves.`
            );
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Insert history record BEFORE updating the flock
    const currentGalpon = flock.ubicacion?.[0]?.galpon || null;
    const changes: string[] = [];
    if (dto.nombre && dto.nombre !== flock.nombre) {
      changes.push(`Nombre de "${flock.nombre}" a "${dto.nombre}"`);
    }
    if (dto.total_aves !== undefined && dto.total_aves !== flock.total_aves) {
      changes.push(`Aves de ${flock.total_aves} a ${dto.total_aves}`);
    }
    if (dto.observacion !== undefined && dto.observacion !== flock.observacion) {
      changes.push(`Observación modificada`);
    }
    if (dto.racion_alimento !== undefined && dto.racion_alimento !== flock.racion_alimento) {
      changes.push(`Ración modificada`);
    }
    if (dto.estado && dto.estado !== flock.estado) {
      changes.push(`Estado de "${flock.estado}" a "${dto.estado}"`);
    }
    const descripcion = changes.length > 0 ? `Editar lote: ${changes.join(', ')}` : 'Editar lote';

    const history = this.historyRepo.create({
      lote: flock,
      galpon: currentGalpon,
      cantidad_asignada: dto.total_aves ?? flock.total_aves,
      descripcion,
      usuario: userDisplayName || 'Sistema',
      nombre_elemento: dto.nombre || flock.nombre,
      raza_nombre: flock.raza?.nombre || null,
    });
    await this.historyRepo.save(history);

    this.flockRepo.merge(flock, dto);
    const updated = await this.flockRepo.save(flock);

    this.logger.log(`Lote actualizado: ${id}`);

    return {
      message: `Lote ${id} actualizado correctamente`,
      data: updated,
    };
  }

  async assignFlock(dto: AssignFlockDto, userDisplayName?: string) {
    const lote = await this.flockRepo.findOne({
      where: { id_lote: dto.loteId },
      relations: ['raza'],
    });
    if (!lote) throw new NotFoundException(`Lote ${dto.loteId} no encontrado`);

    const galpon = await this.barnRepo.findOneBy({ id_galpon: dto.galponId });
    if (!galpon) throw new NotFoundException(`Galpón ${dto.galponId} no encontrado`);

    const location = this.locationRepo.create({
      lote,
      galpon,
    });
    const savedLocation = await this.locationRepo.save(location);

    const history = this.historyRepo.create({
      lote,
      galpon,
      cantidad_asignada: dto.cantidad,
      descripcion: `Asignar galpón: cambiado al galpón "${galpon.nombre}"`,
      usuario: userDisplayName || 'Sistema',
      nombre_elemento: lote.nombre,
      raza_nombre: lote.raza?.nombre || null,
    });
    await this.historyRepo.save(history);

    this.logger.log(`Lote ${dto.loteId} asignado al galpón ${dto.galponId}`);

    return {
      message: 'Lote asignado al galpón correctamente',
      data: savedLocation,
    };
  }

  async registerDeadBirds(dto: RegisterDeadBirdsDto) {
    const lote = await this.flockRepo.findOneBy({ id_lote: dto.loteId });
    if (!lote) throw new NotFoundException(`Lote ${dto.loteId} no encontrado`);

    const deadBird = this.deadBirdRepo.create({
      cantidad: dto.cantidad,
      lote: { id_lote: dto.loteId },
    });
    const saved = await this.deadBirdRepo.save(deadBird);

    lote.total_aves -= dto.cantidad || 0;
    await this.flockRepo.save(lote);

    this.logger.warn(`Aves muertas registradas en lote ${dto.loteId}: ${dto.cantidad}`);

    return {
      message: 'Aves muertas registradas correctamente en el lote',
      data: saved,
    };
  }

  async finishFlock(dto: FinishFlockDto) {
    const lote = await this.flockRepo.findOneBy({ id_lote: dto.loteId });
    if (!lote) throw new NotFoundException(`Lote ${dto.loteId} no encontrado`);

    const finished = this.finishedFlockRepo.create({
      cantidad: dto.cantidad,
      razon: dto.razon,
      lote: { id_lote: dto.loteId },
    });
    const saved = await this.finishedFlockRepo.save(finished);

    // Actualizar estado del lote
    lote.estado = 'FINALIZADO';
    await this.flockRepo.save(lote);

    this.logger.log(`Lote ${dto.loteId} finalizado. Razón: ${dto.razon}`);

    return {
      message: 'Lote finalizado correctamente',
      data: saved,
    };
  }
}
