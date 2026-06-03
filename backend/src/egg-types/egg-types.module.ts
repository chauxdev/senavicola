import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EggTypesService } from './egg-types.service';
import { EggTypesController } from './egg-types.controller';
import { EggType } from './entities/egg-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EggType])],
  controllers: [EggTypesController],
  providers: [EggTypesService],
})
export class EggTypesModule {}
