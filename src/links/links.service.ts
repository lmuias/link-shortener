import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Link } from './schema/links.schema';
import mongoose from 'mongoose';
import * as crypto from 'crypto';

@Injectable()
export class LinksService {
  constructor(
    @InjectModel(Link.name)
    private linkModel: mongoose.Model<Link>,
  ) {}
  async findAll(): Promise<Link[]> {
    const links = await this.linkModel.find();
    return links;
  }
  async create(fullUrl: string): Promise<Link> {
    const shortUrl = crypto.randomBytes(4).toString('hex');

    const newLink = new this.linkModel({ fullUrl, shortUrl });
    return newLink.save();
  }
  async getFullUrl(shortUrl: string): Promise<{ fullUrl: string }> {
    const link = await this.linkModel.findOne({ shortUrl });
    if (!link) {
      throw new NotFoundException('Short URL not found');
    }
    return { fullUrl: link.fullUrl };
  }
}
