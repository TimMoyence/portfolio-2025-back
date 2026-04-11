import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Guard d'authentification par token statique pour le endpoint `/metrics`.
 *
 * Verifie la presence d'un header `Authorization: Bearer <METRICS_TOKEN>`.
 * Si la variable d'environnement `METRICS_TOKEN` n'est pas configuree,
 * le endpoint est desactive (retourne 403).
 */
@Injectable()
export class MetricsAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const metricsToken = this.configService.get<string>('METRICS_TOKEN');

    if (!metricsToken) {
      throw new ForbiddenException(
        'Metrics endpoint not configured: METRICS_TOKEN is missing',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException(
        'Missing or invalid Authorization header for metrics endpoint',
      );
    }

    const token = authHeader.slice('Bearer '.length);

    if (token !== metricsToken) {
      throw new ForbiddenException('Invalid metrics token');
    }

    return true;
  }
}
