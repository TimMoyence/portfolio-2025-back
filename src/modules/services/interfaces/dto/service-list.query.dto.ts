import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const SERVICE_SORT_FIELDS = ['order', 'slug', 'name', 'createdAt'] as const;
const SERVICE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class ServiceListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'order',
    default: 'order',
    enum: SERVICE_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(SERVICE_SORT_FIELDS)
  sortBy: (typeof SERVICE_SORT_FIELDS)[number] = 'order';

  @ApiPropertyOptional({
    example: 'PUBLISHED',
    enum: SERVICE_STATUSES,
  })
  @IsOptional()
  @IsIn(SERVICE_STATUSES)
  status?: (typeof SERVICE_STATUSES)[number];

  @ApiPropertyOptional({
    example: 'ASC',
    default: 'ASC',
    enum: SORT_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  override order: (typeof SORT_DIRECTIONS)[number] = 'ASC';
}
