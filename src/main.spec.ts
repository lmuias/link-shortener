import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(null),
    }),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn(),
  })),
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
  ApiExcludeEndpoint: jest.fn(() => jest.fn()),
  ApiProperty: jest.fn(() => jest.fn()),
  ApiExtraModels: jest.fn(() => jest.fn()),
  ApiOperation: jest.fn(() => jest.fn()),
  ApiResponse: jest.fn(() => jest.fn()),
  ApiTags: jest.fn(() => jest.fn()),
}));

describe('Main bootstrap', () => {
  let appMock: { useGlobalPipes: jest.Mock; listen: jest.Mock };

  beforeAll(async () => {
    appMock = {
      useGlobalPipes: jest.fn(),
      listen: jest.fn().mockResolvedValue(null),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(appMock);
    await import('./main');
  });

  it('should create app with AppModule', () => {
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });

  it('should setup Swagger documentation', () => {
    expect(DocumentBuilder).toHaveBeenCalledTimes(1);
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith(
      'api', 
      appMock, 
      expect.any(Object)
    );
  });

  it('should enable global ValidationPipe', () => {
    expect(appMock.useGlobalPipes).toHaveBeenCalledWith(
      expect.objectContaining({
        validatorOptions: expect.objectContaining({ whitelist: true }),
      })
    );
  });

  it('should start listening on correct port', () => {
    expect(appMock.listen).toHaveBeenCalledWith(3000);
  });
});
