import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const SORT_DIRECTIONS = ['ASC', 'DESC'] as const;

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

  @ApiPropertyOptional({
    example: 'DESC',
    default: 'DESC',
    enum: SORT_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
