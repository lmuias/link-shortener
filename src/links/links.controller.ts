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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateLinkDto } from './dto';
import { NotFoundException } from '@nestjs/common';

@ApiTags('links')
@Controller('links')
@UseGuards(JwtAuthGuard)
export class LinksController {
  constructor(private readonly linkService: LinksService) {}

  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({ summary: 'Get all short links' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a list of short links.',
    schema: {
      example: [{
        fullUrl: 'https://example.com/long/url',
        shortUrl: 'abc123'
      }]
    }
  })
  @Get()
  async getAllLinks(): Promise<Link[]> {
    return this.linkService.findAll();
  }

  
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a short link' })
  @ApiResponse({ 
    status: 201, 
    description: 'Short link created successfully.',
    schema: {
      example: {
        fullUrl: 'https://example.com/long/url',
        shortUrl: 'abc123'
      }
    }
  })  
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @Post()
  async createShorLink(
    @Body() dto: CreateLinkDto
  ): Promise<Link> {
    return this.linkService.create(dto.fullUrl);
  }

  
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @ApiOperation({ summary: 'Redirect to full URL' })
  @ApiResponse({ status: 302, description: 'Redirects to the full URL.' })
  @ApiResponse({ status: 404, description: 'Short URL not found.' })
  @Get(':shortUrl')
  async redirectToFullUrl(
    @Param('shortUrl') shortUrl: string,
    @Res() res: Response,
  ) {
    console.log('Incoming shortUrl:', shortUrl);
    try {
      const link = await this.linkService.getFullUrl(shortUrl);
      return res.redirect(link.fullUrl);
    } catch (error) {
      if (error instanceof NotFoundException) {
        console.log('Short URL not found:', shortUrl);
        return res.status(404).json({ message: 'Short URL not found' });
      }
      throw error;
    }
  }
}
