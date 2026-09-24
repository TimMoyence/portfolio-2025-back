import { applyDecorators, Get, Post, Type, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { ApiQueryOptions } from '@nestjs/swagger';
import type { PaginatedResult, SortOrder } from '../../domain/pagination.types';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { PaginationMetaResponseDto } from '../dto/pagination-meta.response.dto';

export const FILTRE_STATUT_DE_PUBLICATION: ApiQueryOptions = {
  name: 'status',
  required: false,
  enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  example: 'PUBLISHED',
};

export interface ListePubliquePagineeOptions {
  readonly resume: string;
  readonly reponse: Type<unknown>;
  readonly ordreParDefaut: SortOrder;
  readonly triables: readonly string[];
  readonly triParDefaut: string;
  readonly filtres?: readonly ApiQueryOptions[];
}

export function ListePubliquePaginee(
  options: ListePubliquePagineeOptions,
): MethodDecorator {
  return applyDecorators(
    Public(),
    Get(),
    ApiOperation({ summary: options.resume }),
    ApiQuery({ name: 'page', required: false, example: 1, type: Number }),
    ApiQuery({ name: 'limit', required: false, example: 20, type: Number }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: ['ASC', 'DESC'],
      example: options.ordreParDefaut,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: [...options.triables],
      example: options.triParDefaut,
    }),
    ...(options.filtres ?? []).map((filtre) => ApiQuery(filtre)),
    ApiOkResponse({ type: options.reponse }),
  );
}

export function CreationAdmin(
  resume: string,
  reponse: Type<unknown>,
): MethodDecorator {
  return applyDecorators(
    Post(),
    UseGuards(RolesGuard),
    Roles('admin'),
    ApiBearerAuth(),
    ApiOperation({ summary: resume }),
    ApiCreatedResponse({ type: reponse }),
    ApiBadRequestResponse({ description: 'Validation echouee' }),
    ApiUnauthorizedResponse({ description: 'Token JWT invalide ou absent' }),
  );
}

export function reponsePaginee<T, R>(
  resultat: PaginatedResult<T>,
  versReponse: (element: T) => R,
): { items: R[]; meta: PaginationMetaResponseDto } {
  return {
    items: resultat.items.map((element) => versReponse(element)),
    meta: {
      page: resultat.page,
      limit: resultat.limit,
      total: resultat.total,
      totalPages: resultat.totalPages,
    },
  };
}
