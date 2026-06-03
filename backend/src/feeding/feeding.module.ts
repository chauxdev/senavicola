import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feeding } from './entities/feeding.entity';
import { FeedingService } from './feeding.service';
import { FeedingController } from './feeding.controller';
import { User } from '../users/entities/user.entity';
import { Flock } from '../flocks/entities/flock.entity';
import { Supply } from '../supplies/entities/supply.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feeding, User, Flock, Supply])],
  controllers: [FeedingController],
  providers: [FeedingService],
})
export class FeedingModule {}
