import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
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

const DEFI_SANS_JETON = 'Bearer';
const DEFI_DU_JETON_INVALIDE = 'Bearer error="invalid_token"';

function refuserLeJeton(
  context: ExecutionContext,
  defi: string,
  message: string,
): UnauthorizedException {
  context
    .switchToHttp()
    .getResponse<Response>()
    .setHeader('WWW-Authenticate', defi);
  return new UnauthorizedException(message);
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
      throw refuserLeJeton(
        context,
        DEFI_SANS_JETON,
        'Missing or invalid authorization header',
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload = await this.jwtTokenService.verify(token);
      const user = await this.usersRepo.findById(payload.sub);
      if (!user?.isActive) {
        throw new UnauthorizedException('Utilisateur introuvable ou desactive');
      }
      if (!user.emailVerified && !this.isEmailVerificationExempt(request)) {
        throw new ForbiddenException('Email non verifie');
      }
      request.user = { ...payload, roles: user.roles };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw refuserLeJeton(
        context,
        DEFI_DU_JETON_INVALIDE,
        'Invalid or expired token',
      );
    }
  }

  private isEmailVerificationExempt(request: AuthenticatedRequest): boolean {
    const path = request.path;
    return EMAIL_VERIFICATION_EXEMPT_PATHS.some((exempt) =>
      path.endsWith(exempt),
    );
  }
}
