import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Users email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'securePassword123',
    description: 'Users password (minimum 8 chars)',
  })
  @IsString()
  @MinLength(6, { message: 'Password length must be more than 6 characters' })
  @IsNotEmpty()
  password!: string;
}
