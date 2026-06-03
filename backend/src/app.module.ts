import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { SuppliesModule } from './supplies/supplies.module';
import { SupplyCategoriesModule } from './supply-categories/supply-categories.module';
import { MeasurementUnitsModule } from './measurement-units/measurement-units.module';
import { BreedsModule } from './breeds/breeds.module';
import { BarnsModule } from './barns/barns.module';
import { FlocksModule } from './flocks/flocks.module';
import { EggTypesModule } from './egg-types/egg-types.module';
import { EggInventoryModule } from './egg-inventory/egg-inventory.module';
import { FeedingModule } from './feeding/feeding.module';
import { ReportsModule } from './reports/reports.module';
import { SupplyHistoryModule } from './supply-history/supply-history.module';
import { SupplyActionsModule } from './supply-actions/supply-actions.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BackupModule } from './backup/backup.module';

import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        database: configService.get<string>('DB_NAME'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    SuppliesModule,
    SupplyCategoriesModule,
    MeasurementUnitsModule,
    BreedsModule,
    BarnsModule,
    FlocksModule,
    EggTypesModule,
    EggInventoryModule,
    FeedingModule,
    ReportsModule,
    SupplyHistoryModule,
    SupplyActionsModule,
    AuthModule,
    HealthModule,
    DashboardModule,
    BackupModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
