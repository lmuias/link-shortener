import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Link {
  @Prop({ required: true })
  fullUrl: string;

  @Prop({ required: true, unique: true })
  shortUrl: string;
}

export const LinkSchema = SchemaFactory.createForClass(Link);
