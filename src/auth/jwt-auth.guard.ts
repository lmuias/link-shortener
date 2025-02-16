import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface UserPayload {
  email: string;
  password: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Wrong JWT type, or JWT doesnt exist');
    }

    const token: string = authHeader.split(' ')[1];

    try {
      const decoded = await this.jwtService.verifyAsync<UserPayload>(token);
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
