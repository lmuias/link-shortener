import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LinksService } from './links.service';
import { Link } from './schema/links.schema';

@Controller('links')
export class LinksController {
  constructor(private readonly linkService: LinksService) {}

  @Get()
  async getAllLinks(): Promise<Link[]> {
    return this.linkService.findAll();
  }

  @Post()
  async createShorLink(
    @Body('fullUrl')
    fullLink: string,
  ): Promise<Link> {
    return this.linkService.create(fullLink);
  }

  @Get(':shortUrl')
  async redirectToFullUrl(
    @Param('shortUrl')
    shortUrl: string,
  ): Promise<{ fullUrl: string }> {
    return this.linkService.getFullUrl(shortUrl);
  }
}
