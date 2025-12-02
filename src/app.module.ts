import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HealthModule } from './modules/health/health.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('database.url'),
        autoLoadEntities: true,
        synchronize: false,
        logging: false
      })
    }),
    AuthModule,
    HealthModule,
    RoomsModule,
    BookingsModule,
    MaintenanceModule
    // Other modules (maintenance, notifications, audit, auth) to be added incrementally
  ]
})
export class AppModule {}
