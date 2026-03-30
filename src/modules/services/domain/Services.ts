import { DomainValidationError } from '../../../common/domain/errors/DomainValidationError';
import {
  requireText,
  optionalText,
} from '../../../common/domain/validation/domain-validators';
import { Slug } from '../../../common/domain/value-objects/Slug';
import { PublishableStatus } from '../../../common/domain/types/publishable-status';

export type ServiceStatus = PublishableStatus;

export interface CreateServiceProps {
  slug: string;
  name: string;
  icon?: string | null;
  status?: ServiceStatus;
  order?: number;
}

/** Entite domaine representant un service propose dans le portfolio. */
export class Services {
  id?: string;
  slug: string;
  name: string;
  icon?: string;
  status: ServiceStatus;
  order: number;

  static create(props: CreateServiceProps): Services {
    const service = new Services();
    service.slug = Slug.parse(props.slug, 'service slug').toString();
    service.name = requireText(props.name, 'service name', 2, 120);
    service.icon = optionalText(props.icon, 'service icon', 500);
    service.status = this.resolveStatus(props.status);
    service.order = this.resolveOrder(props.order);
    return service;
  }

  private static resolveStatus(raw: unknown): ServiceStatus {
    if (raw === undefined || raw === null) {
      return 'PUBLISHED';
    }

    if (typeof raw !== 'string') {
      throw new DomainValidationError('Invalid service status');
    }

    const normalized = raw.trim().toUpperCase();
    if (
      normalized !== 'DRAFT' &&
      normalized !== 'PUBLISHED' &&
      normalized !== 'ARCHIVED'
    ) {
      throw new DomainValidationError('Invalid service status');
    }

    return normalized;
  }

  private static resolveOrder(raw: unknown): number {
    if (raw === undefined || raw === null) {
      return 0;
    }

    if (!Number.isInteger(raw)) {
      throw new DomainValidationError('Invalid service order');
    }

    const value = Number(raw);
    if (value < 0 || value > 10000) {
      throw new DomainValidationError('Invalid service order');
    }

    return value;
  }
}
