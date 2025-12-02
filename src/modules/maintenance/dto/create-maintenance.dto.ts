import { IsNotEmpty, IsOptional, IsUUID, MinLength } from 'class-validator';

export class CreateMaintenanceDto {
  @IsUUID()
  roomId!: string;

  @IsNotEmpty()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @MinLength(3)
  description?: string;
}
