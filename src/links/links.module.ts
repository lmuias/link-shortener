import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinkSchema } from './schema/links.schema';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Link', schema: LinkSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [LinksController],
  providers: [LinksService, JwtAuthGuard],
  exports: [MongooseModule],
})
export class LinksModule {}
