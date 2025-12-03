import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller({ path: 'bookings', version: '1' })
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiBody({
    type: CreateBookingDto,
    examples: {
      sample: {
        summary: 'Contoh pengajuan booking',
        value: {
          roomId: '8eac0f6e-1a20-4c1c-9d7c-1b1f84d6863a',
          startTime: '2025-12-01T14:00:00.000Z',
          endTime: '2025-12-01T16:00:00.000Z',
          priority: 'NORMAL',
          purpose: 'Rapat koordinasi UKM'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Booking created (PENDING)' })
  @ApiResponse({ status: 400, description: 'Validation or conflict (overlap/maintenance)' })
  @Post()
  create(@Body() dto: CreateBookingDto, @Req() req: any) {
    const { userId, role } = req.user;
    return this.bookingsService.create(dto, { userId, userRole: role });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  list(@Query() query: ListBookingsDto) {
    return this.bookingsService.list(query);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  listMine(@Req() req: any) {
    const { userId } = req.user;
    return this.bookingsService.listByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: any) {
    const { userId, role } = req.user;
    return this.bookingsService.approve(id, { userId, userRole: role });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectBookingDto, @Req() req: any) {
    const { userId, role } = req.user;
    return this.bookingsService.reject(id, dto, { userId, userRole: role });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
    const { userId, role } = req.user;
    return this.bookingsService.cancel(id, { userId, userRole: role });
  }
}
