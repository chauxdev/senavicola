import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barn } from './entities/barn.entity';
import { BarnsService } from './barns.service';
import { BarnsController } from './barns.controller';
import { FlockLocation } from '../flocks/entities/flock-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barn, FlockLocation])],
  controllers: [BarnsController],
  providers: [BarnsService],
})
export class BarnsModule {}
