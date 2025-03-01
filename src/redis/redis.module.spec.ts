import { Test, TestingModule } from '@nestjs/testing';
import { RedisModule } from './redis.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

describe('RedisModule', () => {
  let configService: ConfigService;
  let redisClient: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
        RedisModule,
      ],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
    redisClient = module.get<Redis>('REDIS_CLIENT');
  });

  afterEach(async () => {
    await redisClient.quit();
  });

  it('should be defined', () => {
    expect(redisClient).toBeDefined();
  });

  it('should create redis client with correct config', () => {
    expect(redisClient.options).toMatchObject({
      host: configService.get('REDIS_HOST'),
      port: Number(configService.get('REDIS_PORT')),
      password: configService.get('REDIS_PASSWORD'),
    });
  });

  it('should establish redis connection', async () => {
    await new Promise((resolve) => {
      redisClient.once('ready', resolve);
    });
    expect(redisClient.status).toBe('ready');
  });

  it('should export REDIS_CLIENT provider', () => {
    const exports = Reflect.getMetadata('exports', RedisModule);
    expect(exports).toContain('REDIS_CLIENT');
  });
});