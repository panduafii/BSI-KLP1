import { IsNotEmpty, MinLength } from 'class-validator';

export class RejectBookingDto {
  @IsNotEmpty()
  @MinLength(3)
  reason!: string;
}
