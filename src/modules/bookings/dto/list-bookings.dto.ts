import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { BookingStatus } from '../booking.entity';

export class ListBookingsDto {
  @ApiPropertyOptional({ enum: BookingStatus, example: BookingStatus.PENDING })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ format: 'uuid', example: '8eac0f6e-1a20-4c1c-9d7c-1b1f84d6863a' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2025-12-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time', example: '2025-12-02T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
