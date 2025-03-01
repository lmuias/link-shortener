import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LinksService } from './links.service';
import { Link } from './schema/links.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

describe('LinksService', () => {
  let service: LinksService;
  let linkModel: Model<Link>;
  let redisClient: Redis;

  class MockLinkModel {
    constructor(public data: any) {}
    save = jest.fn().mockResolvedValue(this.data);
    static find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    static findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    static create = jest.fn().mockImplementation((dto) => 
      Promise.resolve({ ...dto, shortUrl: 'generated_short_url' })
    );
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: getModelToken(Link.name),
          useValue: MockLinkModel,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn(),
            setex: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(3600),
          },
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    linkModel = module.get<Model<Link>>(getModelToken(Link.name));
    redisClient = module.get<Redis>('REDIS_CLIENT');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return cached links if available', async () => {
      const cachedLinks = JSON.stringify([{ fullUrl: 'https://example.com', shortUrl: 'abc123' }]);
      (redisClient.get as jest.Mock).mockResolvedValue(cachedLinks);

      const result = await service.findAll();
      expect(result).toEqual(JSON.parse(cachedLinks));
      expect(redisClient.get).toHaveBeenCalledWith('all_links');
    });

    it('should fetch from database if cache is empty', async () => {
      const links = [{ fullUrl: 'https://example.com', shortUrl: 'abc123' }];
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (linkModel.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(links),
      });

      const result = await service.findAll();
      expect(result).toEqual(links);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'all_links',
        3600,
        JSON.stringify(links)
      );
    });
  });

  describe('create', () => {
    it('should create a new short link', async () => {
      const fullUrl = 'https://example.com';
      const shortUrl = 'abc123';
      jest.spyOn(service as any, 'generateShortUrl').mockReturnValue(shortUrl);
      
      const result = await service.create(fullUrl);
      
      expect(result).toEqual(expect.objectContaining({
        fullUrl: 'https://example.com',
        shortUrl: 'abc123',
      }));
      expect(redisClient.del).toHaveBeenCalledWith('all_links');
    });
  });

  describe('getFullUrl', () => {
    it('should return cached full URL if available', async () => {
      const shortUrl = 'abc123';
      const fullUrl = 'https://example.com';
      (redisClient.get as jest.Mock).mockResolvedValue(fullUrl);

      const result = await service.getFullUrl(shortUrl);
      expect(result).toEqual({ fullUrl });
      expect(redisClient.get).toHaveBeenCalledWith(`shorturl:${shortUrl}`);
    });

    it('should fetch from database if cache is empty', async () => {
      const shortUrl = 'abc123';
      const fullUrl = 'https://example.com';
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (linkModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ fullUrl, shortUrl }),
      });

      const result = await service.getFullUrl(shortUrl);
      expect(result).toEqual({ fullUrl });
      expect(redisClient.setex).toHaveBeenCalledWith(
        `shorturl:${shortUrl}`,
        3600,
        fullUrl
      );
    });

    it('should throw NotFoundException if short URL is not found', async () => {
      const shortUrl = 'invalid';
      (redisClient.get as jest.Mock).mockResolvedValue(null);
      (linkModel.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getFullUrl(shortUrl))
        .rejects
        .toThrow('Short URL not found');
    });
  });
});