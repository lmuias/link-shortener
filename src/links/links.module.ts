import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinkSchema } from './schema/links.schema';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Link', schema: LinkSchema }])],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [MongooseModule],
})
export class LinksModule {}
