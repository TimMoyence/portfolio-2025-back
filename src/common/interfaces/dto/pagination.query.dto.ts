import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const SORT_DIRECTIONS = ['ASC', 'DESC'] as const;

export function ChoixOptionnel<T extends string>(
  valeurs: readonly T[],
  options: { readonly exemple: T; readonly parDefaut?: T },
): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      example: options.exemple,
      ...(options.parDefaut === undefined
        ? {}
        : { default: options.parDefaut }),
      enum: valeurs,
    }),
    IsOptional(),
    IsIn(valeurs),
  );
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ChoixOptionnel(SORT_DIRECTIONS, { exemple: 'DESC', parDefaut: 'DESC' })
  order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
