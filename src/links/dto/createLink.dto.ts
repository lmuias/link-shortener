import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty({
    example: 'https://example.com/long/url/to/shorten',
    description: 'Original long url',
  })
  @IsNotEmpty()
  @IsUrl()
  fullUrl!: string;
}