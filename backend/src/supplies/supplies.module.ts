import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliesService } from './supplies.service';
import { SuppliesController } from './supplies.controller';
import { Supply } from './entities/supply.entity';
import { SupplyHistory } from '../supply-history/entities/supply-history.entity';
import { SupplyAction } from '../supply-actions/entities/supply-action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supply, SupplyHistory, SupplyAction])],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService, TypeOrmModule],
})
export class SuppliesModule {}
