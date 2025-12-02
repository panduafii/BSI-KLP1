import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@Controller({ path: 'maintenance', version: '1' })
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateMaintenanceDto, @Req() req: any) {
    const { userId, role } = req.user;
    return this.maintenanceService.create(dto, { userId, userRole: role });
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Req() req: any) {
    const { userId, role } = req.user;
    return this.maintenanceService.resolve(id, { userId, userRole: role });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('open')
  listOpen() {
    return this.maintenanceService.listOpen();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('alerts')
  listAlerts(@Req() req: any) {
    const { userId, role } = req.user;
    return this.maintenanceService.listAlerts({ userId, userRole: role });
  }
}
