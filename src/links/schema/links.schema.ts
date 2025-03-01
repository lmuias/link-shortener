import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';

@ApiExtraModels(Link)
@Schema()
export class Link {
  @Prop({ required: true })
  @ApiProperty({ 
    example: 'https://example.com/long/url', 
    description: 'Original long url' 
  })
  fullUrl!: string;

  @Prop({ required: true, unique: true, index: true })
  @ApiProperty({ 
    example: 'abc123', 
    description: 'Generated short url' 
  })
  shortUrl!: string;
}

export const LinkSchema = SchemaFactory.createForClass(Link);
