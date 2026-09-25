import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import {
  ChoixOptionnel,
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
  @ChoixOptionnel(REDIRECT_SORT_FIELDS, {
    exemple: 'createdAt',
    parDefaut: 'createdAt',
  })
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

  @ChoixOptionnel(SORT_DIRECTIONS, { exemple: 'DESC', parDefaut: 'DESC' })
  override order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
