import { IsDateString, IsEnum, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

import { BookingPriority } from '../booking.entity';

export class CreateBookingDto {
  @IsUUID()
  roomId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsEnum(BookingPriority)
  priority: BookingPriority = BookingPriority.NORMAL;

  @IsNotEmpty()
  @MinLength(3)
  purpose!: string;
}
