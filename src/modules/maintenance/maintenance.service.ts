import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from '../rooms/room.entity';

import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceStatus, MaintenanceTicket } from './maintenance-ticket.entity';

interface RequestContext {
  userId: string;
  userRole: string;
}

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceTicket)
    private readonly maintenanceRepo: Repository<MaintenanceTicket>,
    @InjectRepository(Room) private readonly roomRepo: Repository<Room>
  ) {}

  async create(dto: CreateMaintenanceDto, ctx: RequestContext) {
    this.ensureAdmin(ctx);
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const ticket = this.maintenanceRepo.create({
      roomId: dto.roomId,
      title: dto.title,
      description: dto.description,
      status: MaintenanceStatus.OPEN,
      reportedBy: ctx.userId
    });
    return this.maintenanceRepo.save(ticket);
  }

  async resolve(id: string, ctx: RequestContext) {
    this.ensureAdmin(ctx);
    const ticket = await this.maintenanceRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status === MaintenanceStatus.RESOLVED) {
      throw new ConflictException('Ticket already resolved');
    }

    ticket.status = MaintenanceStatus.RESOLVED;
    ticket.resolvedBy = ctx.userId;
    ticket.resolvedAt = new Date();
    return this.maintenanceRepo.save(ticket);
  }

  async listOpen() {
    return this.maintenanceRepo.find({
      where: { status: MaintenanceStatus.OPEN },
      order: { createdAt: 'DESC' }
    });
  }

  async listAlerts(ctx: RequestContext) {
    this.ensureAdmin(ctx);
    return this.maintenanceRepo.find({
      where: [{ status: MaintenanceStatus.OPEN }, { status: MaintenanceStatus.IN_PROGRESS }],
      relations: ['room'],
      order: { createdAt: 'DESC' }
    });
  }

  private ensureAdmin(ctx: RequestContext) {
    if (!['admin', 'staff'].includes((ctx.userRole || '').toLowerCase())) {
      throw new ConflictException('Admin or staff role required');
    }
  }
}
