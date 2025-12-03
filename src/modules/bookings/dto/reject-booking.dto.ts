import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class RejectBookingDto {
  @ApiProperty({ example: 'Jadwal bentrok dengan rapat lain', minLength: 3 })
  @IsNotEmpty()
  @MinLength(3)
  reason!: string;
}
