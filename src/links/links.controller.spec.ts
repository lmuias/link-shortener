import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { CreateLinkDto } from './dto';
import { Link } from './schema/links.schema';
import { getModelToken } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

describe('LinksController', () => {
  let controller: LinksController;
  let linksService: LinksService;
  const mockResponse = {
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  const mockLink: Link = {
    fullUrl: 'https://example.com',
    shortUrl: 'abc123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot()],
      controllers: [LinksController],
      providers: [
        LinksService,
        {
          provide: getModelToken(Link.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
          },
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LinksController>(LinksController);
    linksService = module.get<LinksService>(LinksService);
  });

  describe('getAllLinks', () => {
    it('should return an array of links', async () => {
      jest.spyOn(linksService, 'findAll').mockResolvedValue([mockLink]);
      const result = await controller.getAllLinks();
      expect(result).toEqual([mockLink]);
      expect(linksService.findAll).toHaveBeenCalled();
    });
  });

  describe('createShorLink', () => {
    it('should create and return a new short link', async () => {
      const dto: CreateLinkDto = { fullUrl: 'https://example.com' };
      jest.spyOn(linksService, 'create').mockResolvedValue(mockLink);

      const result = await controller.createShorLink(dto);
      expect(result).toEqual(mockLink);
      expect(linksService.create).toHaveBeenCalledWith(dto.fullUrl);
    });
  });

  describe('redirectToFullUrl', () => {
    it('should redirect to full URL', async () => {
      jest.spyOn(linksService, 'getFullUrl').mockResolvedValue({
        fullUrl: 'https://example.com',
      });

      await controller.redirectToFullUrl('abc123', mockResponse);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'https://example.com',
      );
    });

    it('should return 404 if short URL not found', async () => {
      jest
        .spyOn(linksService, 'getFullUrl')
        .mockRejectedValue(new NotFoundException('Short URL not found'));

      await controller.redirectToFullUrl('invalid', mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Short URL not found',
      });
    });
  });
});