import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  exports: [SeedService],
})
export class DatabaseSeedModule implements OnApplicationBootstrap {
  constructor(private readonly seedService: SeedService) {}

  async onApplicationBootstrap() {
    console.log('Iniciando ejecución de seeders automáticos...');
    await this.seedService.run();
    console.log('🌱 Seeders ejecutados con éxito al inicio');
  }
}
