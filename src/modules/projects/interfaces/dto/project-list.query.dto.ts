import {
  ChoixOptionnel,
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const PROJECT_SORT_FIELDS = ['order', 'slug', 'type', 'createdAt'] as const;
const PROJECT_TYPES = ['CLIENT', 'SIDE'] as const;
const PROJECT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class ProjectListQueryDto extends PaginationQueryDto {
  @ChoixOptionnel(PROJECT_SORT_FIELDS, { exemple: 'order', parDefaut: 'order' })
  sortBy: (typeof PROJECT_SORT_FIELDS)[number] = 'order';

  @ChoixOptionnel(PROJECT_TYPES, { exemple: 'SIDE' })
  type?: (typeof PROJECT_TYPES)[number];

  @ChoixOptionnel(PROJECT_STATUSES, { exemple: 'PUBLISHED' })
  status?: (typeof PROJECT_STATUSES)[number];

  @ChoixOptionnel(SORT_DIRECTIONS, { exemple: 'ASC', parDefaut: 'ASC' })
  override order: (typeof SORT_DIRECTIONS)[number] = 'ASC';
}
