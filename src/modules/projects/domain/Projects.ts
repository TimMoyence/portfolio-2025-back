import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import { PublishableStatus } from '../../../common/domain/types/publishable-status';
import {
  optionalHttpUrl,
  optionalText,
} from '../../../common/domain/validation/domain-validators';
import {
  resolvePublishableStatus,
  resolveOrder,
} from '../../../common/domain/validation/status-order.utils';
import { Slug } from '../../../common/domain/value-objects/Slug';

export type ProjectType = 'CLIENT' | 'SIDE';
export type ProjectStatus = PublishableStatus;

export type CreateProjectProps = Pick<Projects, 'slug'> &
  Partial<Omit<Projects, 'id' | 'slug'>>;

export class Projects {
  id?: string;
  slug: string;
  type: ProjectType;
  repoUrl?: string;
  liveUrl?: string;
  coverImage?: string;
  gallery: string[];
  stack: string[];
  status: ProjectStatus;
  order: number;

  static create(props: CreateProjectProps): Projects {
    const project = new Projects();
    project.slug = Slug.parse(props.slug, 'project slug').toString();
    project.type = this.resolveType(props.type);
    project.repoUrl = optionalHttpUrl(props.repoUrl, 'project repo URL');
    project.liveUrl = optionalHttpUrl(props.liveUrl, 'project live URL');
    project.coverImage = optionalText(
      props.coverImage,
      'project cover image',
      500,
    );
    project.gallery = this.optionalStringArray(
      props.gallery,
      'project gallery',
      20,
      500,
    );
    project.stack = this.optionalStringArray(
      props.stack,
      'project stack',
      30,
      50,
    );
    project.status = resolvePublishableStatus(props.status, 'project status');
    project.order = resolveOrder(props.order, 'project order');
    return project;
  }

  private static optionalStringArray(
    raw: unknown,
    field: string,
    maxItems: number,
    maxItemLength: number,
  ): string[] {
    if (raw === undefined || raw === null) {
      return [];
    }

    if (!Array.isArray(raw)) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    if (raw.length > maxItems) {
      throw new DomainValidationError(`Invalid ${field}`);
    }

    const normalized = raw
      .map((item) => {
        if (typeof item !== 'string') {
          throw new DomainValidationError(`Invalid ${field}`);
        }
        const value = item.trim();
        if (value.length === 0 || value.length > maxItemLength) {
          throw new DomainValidationError(`Invalid ${field}`);
        }
        return value;
      })
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }

  private static resolveType(raw: unknown): ProjectType {
    if (raw === undefined || raw === null) {
      return 'SIDE';
    }

    if (raw !== 'CLIENT' && raw !== 'SIDE') {
      throw new DomainValidationError('Invalid project type');
    }

    return raw;
  }
}
