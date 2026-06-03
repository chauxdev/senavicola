import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Barn } from './entities/barn.entity';
import { BarnsService } from './barns.service';
import { BarnsController } from './barns.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Barn])],
  controllers: [BarnsController],
  providers: [BarnsService],
})
export class BarnsModule {}
