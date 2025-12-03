import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

import { BookingPriority } from '../booking.entity';

export class CreateBookingDto {
  @ApiProperty({
    format: 'uuid',
    example: '8eac0f6e-1a20-4c1c-9d7c-1b1f84d6863a',
    description: 'Room UUID (lihat /v1/rooms)'
  })
  @IsUUID()
  roomId!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2025-12-01T14:00:00.000Z',
    description: 'Waktu mulai (ISO 8601, UTC)'
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2025-12-01T16:00:00.000Z',
    description: 'Waktu selesai (ISO 8601, UTC)'
  })
  @IsDateString()
  endTime!: string;

  @ApiProperty({
    enum: BookingPriority,
    example: BookingPriority.NORMAL,
    default: BookingPriority.NORMAL,
    description: 'Prioritas booking'
  })
  @IsEnum(BookingPriority)
  priority: BookingPriority = BookingPriority.NORMAL;

  @ApiProperty({
    example: 'Rapat koordinasi UKM',
    minLength: 3,
    description: 'Tujuan peminjaman'
  })
  @IsNotEmpty()
  @MinLength(3)
  purpose!: string;
}
