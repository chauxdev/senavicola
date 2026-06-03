import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EggInventoryService } from './egg-inventory.service';
import { EggInventoryController } from './egg-inventory.controller';
import { EggInventory } from './entities/egg-inventory.entity';
import { EggProduction } from './entities/egg-production.entity';
import { DamagedEgg } from './entities/damaged-egg.entity';
import { EggHistory } from './entities/egg-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EggInventory,
      EggProduction,
      DamagedEgg,
      EggHistory,
    ]),
  ],
  controllers: [EggInventoryController],
  providers: [EggInventoryService],
})
export class EggInventoryModule {}
