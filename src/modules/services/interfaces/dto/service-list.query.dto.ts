import {
  ChoixOptionnel,
  PaginationQueryDto,
  SORT_DIRECTIONS,
} from '../../../../common/interfaces/dto/pagination.query.dto';

const SERVICE_SORT_FIELDS = ['order', 'slug', 'name', 'createdAt'] as const;
const SERVICE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export class ServiceListQueryDto extends PaginationQueryDto {
  @ChoixOptionnel(SERVICE_SORT_FIELDS, { exemple: 'order', parDefaut: 'order' })
  sortBy: (typeof SERVICE_SORT_FIELDS)[number] = 'order';

  @ChoixOptionnel(SERVICE_STATUSES, { exemple: 'PUBLISHED' })
  status?: (typeof SERVICE_STATUSES)[number];

  @ChoixOptionnel(SORT_DIRECTIONS, { exemple: 'ASC', parDefaut: 'ASC' })
  override order: (typeof SORT_DIRECTIONS)[number] = 'ASC';
}
