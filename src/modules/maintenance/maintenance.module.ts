import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from '../rooms/room.entity';

import { MaintenanceTicket } from './maintenance-ticket.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceTicket, Room])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
