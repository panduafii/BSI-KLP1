import { Controller, Get } from '@nestjs/common';

import { RoomsService } from './rooms.service';

@Controller({ path: 'rooms', version: '1' })
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async list() {
    return this.roomsService.findAll();
  }
}
