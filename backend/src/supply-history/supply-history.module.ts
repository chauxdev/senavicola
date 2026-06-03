import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyHistoryService } from './supply-history.service';
import { SupplyHistoryController } from './supply-history.controller';
import { SupplyHistory } from './entities/supply-history.entity';
import { Supply } from '../supplies/entities/supply.entity';
import { SupplyAction } from '../supply-actions/entities/supply-action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplyHistory, Supply, SupplyAction])],
  controllers: [SupplyHistoryController],
  providers: [SupplyHistoryService],
  exports: [SupplyHistoryService],
})
export class SupplyHistoryModule {}
