import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password length must be more than 6 characters' })
  @IsNotEmpty()
  password!: string;
}
