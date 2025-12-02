import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { BookingStatus } from '../booking.entity';

export class ListBookingsDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
