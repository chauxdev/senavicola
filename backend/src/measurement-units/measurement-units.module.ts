import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementUnitsService } from './measurement-units.service';
import { MeasurementUnitsController } from './measurement-units.controller';
import { MeasurementUnit } from './entities/measurement-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MeasurementUnit])],
  controllers: [MeasurementUnitsController],
  providers: [MeasurementUnitsService],
  exports: [MeasurementUnitsService, TypeOrmModule],
})
export class MeasurementUnitsModule {}
