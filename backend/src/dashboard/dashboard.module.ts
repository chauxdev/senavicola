import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

import { Flock } from '../flocks/entities/flock.entity';
import { Barn } from '../barns/entities/barn.entity';
import { EggInventory } from '../egg-inventory/entities/egg-inventory.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { EggProduction } from '../egg-inventory/entities/egg-production.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Flock,
      Barn,
      EggInventory,
      Supply,
      EggProduction,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
