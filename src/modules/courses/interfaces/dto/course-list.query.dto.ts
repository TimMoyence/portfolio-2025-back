import {
  ChoixOptionnel,
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const COURSE_SORT_FIELDS = ['slug', 'title', 'createdAt'] as const;

export class CourseListQueryDto extends PaginationQueryDto {
  @ChoixOptionnel(COURSE_SORT_FIELDS, {
    exemple: 'createdAt',
    parDefaut: 'createdAt',
  })
  sortBy: (typeof COURSE_SORT_FIELDS)[number] = 'createdAt';

  @ChoixOptionnel(SORT_DIRECTIONS, { exemple: 'DESC', parDefaut: 'DESC' })
  override order: (typeof SORT_DIRECTIONS)[number] = 'DESC';
}
