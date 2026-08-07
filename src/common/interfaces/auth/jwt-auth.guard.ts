import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { JwtTokenService } from '../../../modules/users/application/services/JwtTokenService';
import type { JwtPayload } from '../../../modules/users/application/services/JwtPayload';
import type { IUsersRepository } from '../../../modules/users/domain/IUsers.repository';
import { USERS_REPOSITORY } from '../../../modules/users/domain/token';
import { IS_PUBLIC_KEY } from './public.decorator';

const EMAIL_VERIFICATION_EXEMPT_PATHS = [
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/logout',
];

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly reflector: Reflector,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepo: IUsersRepository,
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

      if (!this.isEmailVerificationExempt(request)) {
        await this.ensureEmailVerified(payload.sub);
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Un JWT valide dont le compte a ete supprime doit etre rejete (401)
   * plutot que de laisser passer silencieusement.
   */
  private async ensureEmailVerified(userId: string): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    if (!user.emailVerified) {
      throw new ForbiddenException('Email non verifie');
    }
  }

  private isEmailVerificationExempt(request: AuthenticatedRequest): boolean {
    const path = request.path;
    return EMAIL_VERIFICATION_EXEMPT_PATHS.some((exempt) =>
      path.endsWith(exempt),
    );
  }
}
