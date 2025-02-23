import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Link } from './schema/links.schema';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class LinksService {
  private readonly redisTtl: number;

  constructor(
    @InjectModel(Link.name)
    private linkModel: mongoose.Model<Link>,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private configService: ConfigService,
  ) {
    this.redisTtl = this.configService.get<number>('REDIS_TTL', 3600);
  }
  private getShortUrlCacheKey(shortUrl: string): string {
    return `shorturl:${shortUrl}`;
  }

  private getAllLinksCacheKey(): string {
    return 'all_links';
  }

  private normalizeUrl(url: string): string {
    return url.startsWith('http') ? url : `http://${url}`;
  }

  private generateShortUrl(): string {
    return crypto.randomBytes(4).toString('hex');
  }

  async findAll(): Promise<Link[]> {
    const cacheKey = this.getAllLinksCacheKey();

    const cachedLinks = await this.redisClient.get(cacheKey);
    if (cachedLinks) {
      return JSON.parse(cachedLinks);
    }

    const links = await this.linkModel.find().exec();

    await this.redisClient.setex(cacheKey, this.redisTtl, JSON.stringify(links));

    return links;
  }


  async create(fullUrl: string): Promise<Link> {
    const shortUrl = this.generateShortUrl();
    const newLink = new this.linkModel({
      fullUrl: this.normalizeUrl(fullUrl),
      shortUrl,
    });

    await this.redisClient.del(this.getAllLinksCacheKey());

    return newLink.save();
  }

  async getFullUrl(shortUrl: string): Promise<{ fullUrl: string }> {
    const cacheKey = this.getShortUrlCacheKey(shortUrl);
    const cachedUrl = await this.redisClient.get(cacheKey);
    if (cachedUrl) {
      return { fullUrl: cachedUrl };
    }
    const link = await this.linkModel.findOne({ shortUrl }).exec();
    if (!link) {
      throw new NotFoundException('Short URL not found');
    }

    const fullUrl = this.normalizeUrl(link.fullUrl);

    await this.redisClient.setex(cacheKey, this.redisTtl, fullUrl);

    return { fullUrl };
  }
}
