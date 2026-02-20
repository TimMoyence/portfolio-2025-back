import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const PROJECT_SORT_FIELDS = ['order', 'slug', 'type', 'createdAt'] as const;
const PROJECT_TYPES = ['CLIENT', 'SIDE'] as const;
const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class ProjectListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'order',
    default: 'order',
    enum: PROJECT_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(PROJECT_SORT_FIELDS)
  sortBy: (typeof PROJECT_SORT_FIELDS)[number] = 'order';

  @ApiPropertyOptional({
    example: 'SIDE',
    enum: PROJECT_TYPES,
  })
  @IsOptional()
  @IsIn(PROJECT_TYPES)
  type?: (typeof PROJECT_TYPES)[number];

  @ApiPropertyOptional({
    example: 'PUBLISHED',
    enum: PROJECT_STATUSES,
  })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: (typeof PROJECT_STATUSES)[number];

  @ApiPropertyOptional({
    example: 'ASC',
    default: 'ASC',
    enum: SORT_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  override order: (typeof SORT_DIRECTIONS)[number] = 'ASC';
}
