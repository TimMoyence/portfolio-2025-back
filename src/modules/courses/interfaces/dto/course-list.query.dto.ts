import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const COURSE_SORT_FIELDS = ['slug', 'title', 'createdAt'] as const;

export class CourseListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'createdAt',
    default: 'createdAt',
    enum: COURSE_SORT_FIELDS,
  })
  @IsOptional()
  @IsIn(COURSE_SORT_FIELDS)
  sortBy: (typeof COURSE_SORT_FIELDS)[number] = 'createdAt';

  @ApiPropertyOptional({
    example: 'DESC',
    default: 'DESC',
    enum: SORT_DIRECTIONS,
  })
  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  override order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
