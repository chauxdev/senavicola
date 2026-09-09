import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import AppDataSource from '../../config/data-source';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from '../../roles/entities/user-role.entity';
import { Permission } from '../../permissions/entities/permission.entity';
import { RolePermission } from '../../permissions/entities/role-permission.entity';
import { Breed } from '../../breeds/entities/breed.entity';
import { EggType } from '../../egg-types/entities/egg-type.entity';
import { SupplyCategory } from '../../supply-categories/entities/supply-category.entity';
import { MeasurementUnit } from '../../measurement-units/entities/measurement-unit.entity';
import { SupplyAction } from '../../supply-actions/entities/supply-action.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(AppDataSource.options),
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      Permission,
      RolePermission,
      Breed,
      EggType,
      SupplyCategory,
      MeasurementUnit,
      SupplyAction,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
