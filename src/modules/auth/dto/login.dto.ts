import { IsNotEmpty, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @Matches(/^[0-9]{8,20}$/)
  nim!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
