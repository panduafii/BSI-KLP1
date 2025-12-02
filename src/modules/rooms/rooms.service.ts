import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Room } from './room.entity';

@Injectable()
export class RoomsService {
  constructor(@InjectRepository(Room) private readonly repo: Repository<Room>) {}

  async findAll() {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoin(
        'maintenance_tickets',
        'mt',
        "mt.room_id = r.id AND mt.status IN ('OPEN','IN_PROGRESS')"
      )
      .addSelect('COUNT(mt.id) > 0', 'is_under_maintenance')
      .groupBy('r.id')
      .orderBy('r.code', 'ASC');

    const result = await qb.getRawAndEntities();
    return result.entities.map((room, idx) => ({
      ...room,
      isUnderMaintenance: Boolean(result.raw[idx].is_under_maintenance)
    }));
  }
}
