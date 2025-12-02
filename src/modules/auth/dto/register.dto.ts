import { IsEnum, IsNotEmpty, Matches, MinLength } from 'class-validator';

import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  @Matches(/^[0-9]{8,20}$/)
  nim!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role: UserRole = UserRole.STUDENT;
}
