import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LinksService } from './links.service';
import { Link } from './schema/links.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private readonly linkService: LinksService) {}

  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @Get()
  async getAllLinks(): Promise<Link[]> {
    return this.linkService.findAll();
  }

  
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @Post()
  async createShorLink(
    @Body('fullUrl')
    fullLink: string,
  ): Promise<Link> {
    return this.linkService.create(fullLink);
  }

  
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @Get(':shortUrl')
  async redirectToFullUrl(
    @Param('shortUrl') shortUrl: string,
    @Res() res: Response,
  ) {
    console.log('Incoming shortUrl:', shortUrl);
    const link = await this.linkService.getFullUrl(shortUrl);
    if (link && link.fullUrl) {
      return res.redirect(link.fullUrl);
    } else {
      console.log('Short URL not found:', shortUrl);
      return res.status(404).json({ message: 'Short URL not found' });
    }
  }
}
