import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplyCategoriesService } from './supply-categories.service';
import { SupplyCategoriesController } from './supply-categories.controller';
import { SupplyCategory } from './entities/supply-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplyCategory])],
  controllers: [SupplyCategoriesController],
  providers: [SupplyCategoriesService],
  exports: [SupplyCategoriesService, TypeOrmModule],
})
export class SupplyCategoriesModule {}
