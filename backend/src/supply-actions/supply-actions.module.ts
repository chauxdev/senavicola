import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyActionsService } from './supply-actions.service';
import { SupplyActionsController } from './supply-actions.controller';
import { SupplyAction } from './entities/supply-action.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplyAction])],
  controllers: [SupplyActionsController],
  providers: [SupplyActionsService],
  exports: [SupplyActionsService, TypeOrmModule],
})
export class SupplyActionsModule {}
