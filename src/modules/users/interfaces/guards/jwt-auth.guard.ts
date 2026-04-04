import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtTokenService } from '../../application/services/JwtTokenService';
import type { JwtPayload } from '../../application/services/JwtPayload';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/** Extension du type Request pour y attacher le payload JWT. */
interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Guard global d'authentification JWT.
 * Verifie la presence et la validite du Bearer token dans le header Authorization.
 * Les routes decorees avec @Public() sont exclues de la verification.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtTokenService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
