import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import {
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const REDIRECT_SORT_FIELDS = ['slug', 'clicks', 'createdAt'] as const;

function parseBooleanQueryValue(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return value;
}

export class RedirectListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'createdAt',
    default: 'createdAt',
    enum: REDIRECT_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(REDIRECT_SORT_FIELDS)
  sortBy: (typeof REDIRECT_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => parseBooleanQueryValue(value))
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    example: 'DESC',
    default: 'DESC',
    enum: SORT_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  override order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
