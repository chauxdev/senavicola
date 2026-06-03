import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flock } from '../flocks/entities/flock.entity';
import { Barn } from '../barns/entities/barn.entity';
import { EggInventory } from '../egg-inventory/entities/egg-inventory.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { EggProduction } from '../egg-inventory/entities/egg-production.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Flock) private flockRepo: Repository<Flock>,
    @InjectRepository(Barn) private barnRepo: Repository<Barn>,
    @InjectRepository(EggInventory) private eggRepo: Repository<EggInventory>,
    @InjectRepository(Supply) private supplyRepo: Repository<Supply>,
    @InjectRepository(EggProduction) private prodRepo: Repository<EggProduction>,
  ) {}

  async getStats() {
    // Totals
    const totalGalpones = await this.barnRepo.count();
    const totalInsumos = await this.supplyRepo.count();

    const flocks = await this.flockRepo.find();
    const totalLotes = flocks.filter(f => f.estado === 'ACTIVO').length;
    const totalGallinas = flocks.filter(f => f.estado === 'ACTIVO').reduce((s, f) => s + (f.total_aves || 0), 0);
    const gallinasFinalizadas = flocks.filter(f => f.estado !== 'ACTIVO').reduce((s, f) => s + (f.total_aves || 0), 0);

    const eggs = await this.eggRepo.find({ relations: ['tipo_huevo'] });
    const totalHuevos = eggs.reduce((s, e) => s + (e.cantidad || 0), 0);
    const totalClasificados = eggs.length;

    // Charts Data
    const huevosPorTipo = {};
    for (const e of eggs) {
      const tipo = e.tipo_huevo?.tipo || 'Desconocido';
      huevosPorTipo[tipo] = (huevosPorTipo[tipo] || 0) + e.cantidad;
    }

    const supplies = await this.supplyRepo.find({ relations: ['categoria'] });
    const insumosPorCategoria = {};
    for (const s of supplies) {
      const cat = s.categoria?.nombre_categoria || 'Otros';
      insumosPorCategoria[cat] = (insumosPorCategoria[cat] || 0) + 1;
    }

    // Producción últimos 7 días
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const production = await this.prodRepo.createQueryBuilder('p')
      .where('p.produccionFecha >= :date', { date: last7Days })
      .orderBy('p.produccionFecha', 'ASC')
      .getMany();

    const produccionPorDia = {};
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (const p of production) {
      const date = new Date(p.produccionFecha);
      const dayName = diasSemana[date.getDay()];
      produccionPorDia[dayName] = (produccionPorDia[dayName] || 0) + p.cantidady;
    }

    return {
      message: 'Estadísticas del dashboard',
      data: {
        totals: {
          huevos: totalHuevos,
          gallinas: totalGallinas,
          lotes: totalLotes,
          clasificados: totalClasificados,
          galpones: totalGalpones,
          insumos: totalInsumos,
        },
        charts: {
          huevosPorTipo,
          insumosPorCategoria,
          produccionPorDia,
          estadoGallinas: {
            activas: totalGallinas,
            finalizadas: gallinasFinalizadas
          }
        }
      }
    };
  }
}
